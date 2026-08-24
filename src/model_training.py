import os
import joblib
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor
from xgboost import XGBRegressor
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error

class ModelTrainer:
    """
    Time-Series ML Model Training, Evaluation, and Comparison Pipeline.
    Evaluates XGBoost, Random Forest, Ridge Regression, and Weighted Ensemble.
    """

    def __init__(self, target_col='units_sold'):
        self.target_col = target_col
        self.models = {}
        self.label_encoders = {}
        self.feature_cols = []
        self.metrics = {}

    def prepare_features(self, df: pd.DataFrame, is_train=True):
        """
        Encodes categorical features and selects numeric predictors.
        """
        df_encoded = df.copy()
        categorical_cols = ['store_id', 'product_id', 'category']
        
        for col in categorical_cols:
            if is_train:
                le = LabelEncoder()
                df_encoded[col + '_enc'] = le.fit_transform(df_encoded[col].astype(str))
                self.label_encoders[col] = le
            else:
                le = self.label_encoders[col]
                # Handle unseen categories gracefully
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
        """
        Splits dataset chronologically based on date.
        """
        df = df.sort_values(by='date').reset_index(drop=True)
        unique_dates = df['date'].unique()
        split_idx = int(len(unique_dates) * (1 - test_ratio))
        split_date = unique_dates[split_idx]

        train_df = df[df['date'] < split_date].copy()
        test_df = df[df['date'] >= split_date].copy()

        return train_df, test_df, split_date

    def calculate_metrics(self, y_true, y_pred):
        """
        Calculates R2, WAPE, MAPE, RMSE, MAE, and Accuracy Score.
        """
        y_true = np.array(y_true)
        y_pred = np.clip(np.array(y_pred), a_min=0, a_max=None) # Sales cannot be negative

        r2 = r2_score(y_true, y_pred)
        rmse = np.sqrt(mean_squared_error(y_true, y_pred))
        mae = mean_absolute_error(y_true, y_pred)
        
        # WAPE (Weighted Absolute Percentage Error)
        wape = np.sum(np.abs(y_true - y_pred)) / (np.sum(y_true) + 1e-5)
        # MAPE (avoiding division by zero)
        mape = np.mean(np.abs((y_true - y_pred) / np.maximum(y_true, 1.0)))
        
        # Accuracy Score: Based on R2 variance explained & MAPE precision
        accuracy_score = max(0, min(100.0, r2 * 100.0))

        return {
            "R2_Score": round(float(r2), 4),
            "RMSE": round(float(rmse), 4),
            "MAE": round(float(mae), 4),
            "WAPE": round(float(wape), 4),
            "MAPE_Pct": round(float(mape * 100), 2),
            "Accuracy_Pct": round(float(accuracy_score), 2)
        }

    def train_and_evaluate(self, train_df: pd.DataFrame, test_df: pd.DataFrame):
        """
        Trains XGBoost, Random Forest, Ridge, and Ensemble models.
        """
        X_train, y_train = self.prepare_features(train_df, is_train=True)
        X_test, y_test = self.prepare_features(test_df, is_train=False)

        # 1. XGBoost
        xgb_model = XGBRegressor(
            n_estimators=300,
            learning_rate=0.04,
            max_depth=6,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42
        )
        xgb_model.fit(X_train, y_train)
        y_pred_xgb = xgb_model.predict(X_test)
        self.models['XGBoost'] = xgb_model
        self.metrics['XGBoost'] = self.calculate_metrics(y_test, y_pred_xgb)

        # 2. Random Forest
        rf_model = RandomForestRegressor(
            n_estimators=150,
            max_depth=12,
            random_state=42,
            n_jobs=-1
        )
        rf_model.fit(X_train, y_train)
        y_pred_rf = rf_model.predict(X_test)
        self.models['RandomForest'] = rf_model
        self.metrics['RandomForest'] = self.calculate_metrics(y_test, y_pred_rf)

        # 3. Ridge Regression (Baseline)
        ridge_model = Ridge(alpha=10.0)
        ridge_model.fit(X_train, y_train)
        y_pred_ridge = ridge_model.predict(X_test)
        self.models['Ridge'] = ridge_model
        self.metrics['Ridge'] = self.calculate_metrics(y_test, y_pred_ridge)

        # 4. Ensemble (60% XGBoost + 40% RF)
        y_pred_ensemble = 0.60 * y_pred_xgb + 0.40 * y_pred_rf
        self.metrics['Ensemble'] = self.calculate_metrics(y_test, y_pred_ensemble)

        # Feature Importance from XGBoost
        feature_importance = pd.DataFrame({
            'feature': self.feature_cols,
            'importance': xgb_model.feature_importances_
        }).sort_values(by='importance', ascending=False).reset_index(drop=True)

        return {
            "metrics": self.metrics,
            "feature_importance": feature_importance,
            "predictions": {
                "y_true": y_test.values,
                "XGBoost": y_pred_xgb,
                "RandomForest": y_pred_rf,
                "Ridge": y_pred_ridge,
                "Ensemble": y_pred_ensemble
            }
        }

    def save_artifacts(self, output_dir="models"):
        """
        Saves trained models and encoders to disk.
        """
        os.makedirs(output_dir, exist_ok=True)
        joblib.dump(self.models, os.path.join(output_dir, "models.joblib"))
        joblib.dump(self.label_encoders, os.path.join(output_dir, "label_encoders.joblib"))
        joblib.dump(self.feature_cols, os.path.join(output_dir, "feature_cols.joblib"))
        print(f"Artifacts saved successfully to {output_dir}/")

if __name__ == "__main__":
    from data_generator import generate_retail_sales_data
    from preprocessing import DataPreprocessor
    from feature_engineering import FeatureEngineer

    print("Generating data...")
    df_raw = generate_retail_sales_data(num_days=730)
    
    print("Preprocessing & Feature Engineering...")
    processor = DataPreprocessor()
    df_clean = processor.clean_data(df_raw)
    
    fe = FeatureEngineer()
    df_feat = fe.transform(df_clean)

    trainer = ModelTrainer()
    train_df, test_df, split_date = trainer.train_test_split_chronological(df_feat)
    print(f"Split date: {split_date}. Train size: {len(train_df)}, Test size: {len(test_df)}")

    results = trainer.train_and_evaluate(train_df, test_df)
    print("\nModel Evaluation Metrics:")
    for model_name, m in results['metrics'].items():
        print(f"[{model_name}] R2: {m['R2_Score']} | WAPE: {m['WAPE']} | Accuracy: {m['Accuracy_Pct']}% | RMSE: {m['RMSE']}")

    trainer.save_artifacts()
