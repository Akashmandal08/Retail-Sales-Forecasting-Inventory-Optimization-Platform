import pandas as pd
import numpy as np
from statsmodels.tsa.stattools import adfuller

class DataPreprocessor:
    """
    Data Preprocessing & Data Cleaning pipeline for time-series sales forecasting.
    Includes:
    - Null & Zero check/imputation
    - Outlier detection & winsorization (IQR method)
    - Date parsing & Sorting
    - Time series stationarity test (Augmented Dickey-Fuller)
    """

    def __init__(self, iqr_multiplier=2.5):
        self.iqr_multiplier = iqr_multiplier

    def clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Cleans data: formats dates, handles missing values, removes invalid negative counts.
        """
        df = df.copy()
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values(by=['store_id', 'product_id', 'date']).reset_index(drop=True)
        
        # Fill missing values if any
        if df['units_sold'].isnull().any():
            df['units_sold'] = df.groupby(['store_id', 'product_id'])['units_sold'].transform(lambda x: x.fillna(x.median()))
            
        if df['selling_price'].isnull().any():
            df['selling_price'] = df['selling_price'].fillna(df['base_price'])

        # Clip negative values
        df['units_sold'] = df['units_sold'].clip(lower=0)
        df['total_revenue'] = df['units_sold'] * df['selling_price']
        
        return df

    def handle_outliers(self, df: pd.DataFrame, target_col='units_sold') -> pd.DataFrame:
        """
        Detects and caps extreme outliers per product using group-level IQR.
        """
        df = df.copy()
        
        q1 = df.groupby(['store_id', 'product_id'])[target_col].transform(lambda x: x.quantile(0.25))
        q3 = df.groupby(['store_id', 'product_id'])[target_col].transform(lambda x: x.quantile(0.75))
        iqr = q3 - q1
        lower_bound = (q1 - self.iqr_multiplier * iqr).clip(lower=0)
        upper_bound = q3 + self.iqr_multiplier * iqr
        df[target_col] = df[target_col].clip(lower=lower_bound, upper=upper_bound)
        return df

    def test_stationarity(self, series: pd.Series) -> dict:
        """
        Performs Augmented Dickey-Fuller (ADF) test on a given time-series.
        Returns p-value and boolean indication of stationarity.
        """
        series_clean = series.dropna()
        if len(series_clean) < 20:
            return {"is_stationary": False, "p_value": 1.0, "adf_stat": 0.0}
            
        result = adfuller(series_clean)
        return {
            "adf_stat": float(result[0]),
            "p_value": float(result[1]),
            "is_stationary": bool(result[1] < 0.05)
        }

if __name__ == "__main__":
    from data_generator import generate_retail_sales_data
    df_raw = generate_retail_sales_data(num_days=100)
    processor = DataPreprocessor()
    df_clean = processor.clean_data(df_raw)
    df_capped = processor.handle_outliers(df_clean)
    adf_res = processor.test_stationarity(df_clean['units_sold'])
    print(f"Cleaned dataset shape: {df_capped.shape}")
    print(f"Stationarity Test Result: {adf_res}")
