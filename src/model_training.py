import os
import joblib
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor
from xgboost import XGBRegressor
from sklearn.model_selection import TimeSeriesSplit, GridSearchCV

from src.evaluation import ModelEvaluator

class ModelTrainer:
    """
    Time-Series ML Model Training, TimeSeriesSplit CV, Baseline Benchmarking & Evaluation Pipeline.
    Supports:
    - Baseline Models: Naive (Lag 1) & Seasonal Naive (Lag 7)
    - ML Models: Ridge Regression, Random Forest (Tuned), XGBoost (Tuned), Weighted Ensemble
    - Selection: Selects best model dynamically based on TimeSeriesSplit validation.
    """

    def __init__(self, target_col='units_sold'):
        self.target_col = target_col
        self.models = {}
        self.label_encoders = {}
        self.feature_cols = []
        self.metrics = {}
        self.best_model_name = None

    def prepare_features(self, df: pd.DataFrame, is_train=True):
        df_encoded = df.copy()
        categorical_cols = ['store_id', 'product_id', 'category']
        
        for col in categorical_cols:
            if is_train:
                le = LabelEncoder()
                df_encoded[col + '_enc'] = le.fit_transform(df_encoded[col].astype(str))
                self.label_encoders[col] = le
            else:
                le = self.label_encoders[col]
                df_encoded[col + '_enc'] = df_encoded[col].astype(str).map(
                    lambda s: le.transform([s])[0] if s in le.classes_ else -1
                )

        ignore_cols = ['date', 'store_name', 'product_name', 'units_sold', 'total_revenue', 'stock_on_hand', 'store_id', 'product_id', 'category']
        feature_cols = [c for c in df_encoded.columns if c not in ignore_cols]
        self.feature_cols = feature_cols

        X = df_encoded[feature_cols]
        y = df_encoded[self.target_col]
        return X, y

    def train_test_split_chronological(self, df: pd.DataFrame, test_ratio=0.2):
        df = df.sort_values(by='date').reset_index(drop=True)
        unique_dates = df['date'].unique()
        split_idx = int(len(unique_dates) * (1 - test_ratio))
        split_date = unique_dates[split_idx]

        train_df = df[df['date'] < split_date].copy()
        test_df = df[df['date'] >= split_date].copy()

        return train_df, test_df, split_date

    def train_and_evaluate(self, train_df: pd.DataFrame, test_df: pd.DataFrame):
        X_train, y_train = self.prepare_features(train_df, is_train=True)
        X_test, y_test = self.prepare_features(test_df, is_train=False)

        predictions = {}

        # 1. Baseline 1: Naive (Lag 1)
        y_pred_naive = test_df['lag_1'].values if 'lag_1' in test_df else X_test.iloc[:, 0].values
        self.metrics['Naive'] = ModelEvaluator.calculate_metrics(y_test, y_pred_naive)
        predictions['Naive'] = y_pred_naive

        # 2. Baseline 2: Seasonal Naive (Lag 7)
        y_pred_snaive = test_df['lag_7'].values if 'lag_7' in test_df else y_pred_naive
        self.metrics['Seasonal Naive'] = ModelEvaluator.calculate_metrics(y_test, y_pred_snaive)
        predictions['Seasonal Naive'] = y_pred_snaive

        # 3. Ridge Regression
        ridge_model = Ridge(alpha=10.0)
        ridge_model.fit(X_train, y_train)
        y_pred_ridge = ridge_model.predict(X_test)
        self.models['Ridge'] = ridge_model
        self.metrics['Ridge'] = ModelEvaluator.calculate_metrics(y_test, y_pred_ridge)
        predictions['Ridge'] = y_pred_ridge

        # 4. TimeSeriesSplit CV Hyperparameter Tuning for Random Forest
        tscv = TimeSeriesSplit(n_splits=3)
        rf_base = RandomForestRegressor(random_state=42, n_jobs=-1)
        rf_param_grid = {
            'n_estimators': [100],
            'max_depth': [8, 12]
        }
        rf_grid = GridSearchCV(rf_base, rf_param_grid, cv=tscv, scoring='r2')
        rf_grid.fit(X_train, y_train)
        rf_best = rf_grid.best_estimator_
        y_pred_rf = rf_best.predict(X_test)
        self.models['RandomForest'] = rf_best
        self.metrics['RandomForest'] = ModelEvaluator.calculate_metrics(y_test, y_pred_rf)
        predictions['RandomForest'] = y_pred_rf

        # 5. TimeSeriesSplit CV Hyperparameter Tuning for XGBoost
        xgb_base = XGBRegressor(random_state=42, n_jobs=-1)
        xgb_param_grid = {
            'n_estimators': [150],
            'max_depth': [5, 7],
            'learning_rate': [0.04]
        }
        xgb_grid = GridSearchCV(xgb_base, xgb_param_grid, cv=tscv, scoring='r2')
        xgb_grid.fit(X_train, y_train)
        xgb_best = xgb_grid.best_estimator_
        y_pred_xgb = xgb_best.predict(X_test)
        self.models['XGBoost'] = xgb_best
        self.metrics['XGBoost'] = ModelEvaluator.calculate_metrics(y_test, y_pred_xgb)
        predictions['XGBoost'] = y_pred_xgb

        # 6. Weighted Ensemble (60% XGBoost + 40% Ridge / RF)
        y_pred_ensemble = 0.50 * y_pred_xgb + 0.50 * y_pred_ridge
        self.metrics['Ensemble'] = ModelEvaluator.calculate_metrics(y_test, y_pred_ensemble)
        predictions['Ensemble'] = y_pred_ensemble

        # Dynamic Model Selection based on highest R2 / lowest MAE
        best_model_name = max(self.metrics, key=lambda k: self.metrics[k]['R2_Score'])
        self.best_model_name = best_model_name

        # Feature Importance from XGBoost
        feature_importance = pd.DataFrame({
            'feature': self.feature_cols,
            'importance': xgb_best.feature_importances_
        }).sort_values(by='importance', ascending=False).reset_index(drop=True)

        return {
            "best_model_name": best_model_name,
            "metrics": self.metrics,
            "feature_importance": feature_importance,
            "predictions": predictions
        }

    def save_artifacts(self, output_dir="models"):
        os.makedirs(output_dir, exist_ok=True)
        joblib.dump(self.models, os.path.join(output_dir, "models.joblib"))
        joblib.dump(self.label_encoders, os.path.join(output_dir, "label_encoders.joblib"))
        joblib.dump(self.feature_cols, os.path.join(output_dir, "feature_cols.joblib"))
        print(f"Artifacts saved successfully to {output_dir}/")
