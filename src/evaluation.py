import numpy as np
import pandas as pd
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error

class ModelEvaluator:
    """
    Evaluation suite for time-series forecasting models.
    Computes R2, MAE, RMSE, MAPE, WAPE, and prediction intervals.
    """

    @staticmethod
    def calculate_metrics(y_true, y_pred) -> dict:
        y_true = np.array(y_true)
        y_pred = np.clip(np.array(y_pred), a_min=0, a_max=None)

        r2 = r2_score(y_true, y_pred)
        mae = mean_absolute_error(y_true, y_pred)
        rmse = np.sqrt(mean_squared_error(y_true, y_pred))
        
        # WAPE (Weighted Absolute Percentage Error)
        wape = np.sum(np.abs(y_true - y_pred)) / (np.sum(y_true) + 1e-5)
        # MAPE (Mean Absolute Percentage Error)
        mape = np.mean(np.abs((y_true - y_pred) / np.maximum(y_true, 1.0)))

        variance_explained_pct = round(float(max(0, r2 * 100.0)), 2)

        return {
            "R2_Score": round(float(r2), 4),
            "Variance_Explained_Pct": variance_explained_pct,
            "MAE": round(float(mae), 4),
            "RMSE": round(float(rmse), 4),
            "MAPE_Pct": round(float(mape * 100.0), 2),
            "WAPE": round(float(wape), 4)
        }

    @staticmethod
    def calculate_prediction_intervals(y_pred, residual_std: float, confidence_level=0.90):
        """
        Calculates lower and upper prediction bounds based on residual standard error.
        For 90% confidence level, z = 1.645.
        """
        z_multiplier = 1.645 if confidence_level == 0.90 else 1.96
        y_pred = np.array(y_pred)
        margin = z_multiplier * residual_std

        lower_bound = np.clip(y_pred - margin, a_min=0, a_max=None)
        upper_bound = y_pred + margin

        return lower_bound, upper_bound
