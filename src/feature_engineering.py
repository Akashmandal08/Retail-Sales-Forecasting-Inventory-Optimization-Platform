import pandas as pd
import numpy as np

class FeatureEngineer:
    """
    Feature Engineering Module for Time-Series Sales Forecasting.
    Generates temporal, calendar, lag, rolling window, and promotional features.
    """

    def __init__(self, lag_days=[1, 7, 14, 28, 30], rolling_windows=[7, 14, 30]):
        self.lag_days = lag_days
        self.rolling_windows = rolling_windows

    def create_calendar_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Extracts temporal calendar features and sine/cosine cyclical transformations.
        """
        df = df.copy()
        df['date'] = pd.to_datetime(df['date'])
        
        df['day_of_week'] = df['date'].dt.dayofweek
        df['day_of_month'] = df['date'].dt.day
        df['day_of_year'] = df['date'].dt.dayofyear
        df['month'] = df['date'].dt.month
        df['quarter'] = df['date'].dt.quarter
        df['year'] = df['date'].dt.year
        df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
        df['is_month_start'] = df['date'].dt.is_month_start.astype(int)
        df['is_month_end'] = df['date'].dt.is_month_end.astype(int)
        
        # Cyclical month & day-of-week encoding
        df['sin_month'] = np.sin(2 * np.pi * df['month'] / 12)
        df['cos_month'] = np.cos(2 * np.pi * df['month'] / 12)
        df['sin_dow'] = np.sin(2 * np.pi * df['day_of_week'] / 7)
        df['cos_dow'] = np.cos(2 * np.pi * df['day_of_week'] / 7)
        
        return df

    def create_lag_features(self, df: pd.DataFrame, target_col='units_sold') -> pd.DataFrame:
        """
        Creates historical lag features for each (store, product) group.
        """
        df = df.copy()
        df = df.sort_values(by=['store_id', 'product_id', 'date']).reset_index(drop=True)
        
        grouped = df.groupby(['store_id', 'product_id'])[target_col]
        
        for lag in self.lag_days:
            df[f'lag_{lag}'] = grouped.shift(lag)
            
        return df

    def create_rolling_features(self, df: pd.DataFrame, target_col='units_sold') -> pd.DataFrame:
        """
        Creates rolling statistics (mean, std, min, max) over shifted windows to prevent data leakage.
        """
        df = df.copy()
        df = df.sort_values(by=['store_id', 'product_id', 'date']).reset_index(drop=True)
        
        for window in self.rolling_windows:
            # Shift by 1 day first to ensure we use only past values for predicting current day
            shifted_series = df.groupby(['store_id', 'product_id'])[target_col].shift(1)
            
            rolling = shifted_series.groupby([df['store_id'], df['product_id']]).rolling(window=window)
            
            df[f'rolling_mean_{window}'] = rolling.mean().reset_index(drop=True)
            df[f'rolling_std_{window}'] = rolling.std().reset_index(drop=True)
            df[f'rolling_min_{window}'] = rolling.min().reset_index(drop=True)
            df[f'rolling_max_{window}'] = rolling.max().reset_index(drop=True)

        return df

    def create_interaction_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Creates pricing, promotional, and ratio features.
        """
        df = df.copy()
        # Price ratio vs base price
        df['price_ratio'] = df['selling_price'] / (df['base_price'] + 1e-5)
        # Price difference
        df['price_diff'] = df['base_price'] - df['selling_price']
        
        return df

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Executes full feature engineering pipeline and drops NaN rows created by lags.
        """
        df_feat = self.create_calendar_features(df)
        df_feat = self.create_lag_features(df_feat)
        df_feat = self.create_rolling_features(df_feat)
        df_feat = self.create_interaction_features(df_feat)
        
        # Drop rows with NaN values resulting from maximum lag lookback
        max_lookback = max(max(self.lag_days), max(self.rolling_windows))
        df_clean = df_feat.dropna().reset_index(drop=True)
        
        return df_clean

if __name__ == "__main__":
    from data_generator import generate_retail_sales_data
    from preprocessing import DataPreprocessor
    
    df_raw = generate_retail_sales_data(num_days=90)
    processor = DataPreprocessor()
    df_clean = processor.clean_data(df_raw)
    
    fe = FeatureEngineer()
    df_transformed = fe.transform(df_clean)
    print(f"Transformed dataset shape: {df_transformed.shape}")
    print("New engineered features:", [c for c in df_transformed.columns if 'lag' in c or 'rolling' in c])
