import unittest
import pandas as pd
import numpy as np

from src.data_generator import generate_retail_sales_data
from src.preprocessing import DataPreprocessor
from src.feature_engineering import FeatureEngineer
from src.model_training import ModelTrainer
from src.inventory_optimizer import InventoryOptimizer

class TestRetailSalesForecastingPipeline(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        """
        Generate raw dataset once for tests.
        """
        print("\n--- Initializing Test Pipeline Data Generation ---")
        cls.df_raw = generate_retail_sales_data(num_days=365, num_stores=2, random_seed=42)
        
        cls.processor = DataPreprocessor()
        cls.df_clean = cls.processor.clean_data(cls.df_raw)
        cls.df_capped = cls.processor.handle_outliers(cls.df_clean)
        
        cls.fe = FeatureEngineer(lag_days=[1, 7, 14], rolling_windows=[7, 14])
        cls.df_transformed = cls.fe.transform(cls.df_capped)

    def test_01_data_generator(self):
        """
        Verify raw data generation shape and column integrity.
        """
        self.assertGreater(len(self.df_raw), 0)
        required_cols = ['date', 'store_id', 'product_id', 'selling_price', 'units_sold', 'total_revenue']
        for col in required_cols:
            self.assertIn(col, self.df_raw.columns)
        self.assertFalse(self.df_raw['units_sold'].isnull().any())
        print("Test 1 Passed: Data Generation & Schema Verified.")

    def test_02_preprocessing_and_stationarity(self):
        """
        Verify preprocessing and stationarity testing.
        """
        self.assertFalse(self.df_clean['units_sold'].isnull().any())
        self.assertTrue((self.df_clean['units_sold'] >= 0).all())
        
        adf_res = self.processor.test_stationarity(self.df_clean['units_sold'])
        self.assertIn('is_stationary', adf_res)
        self.assertIn('p_value', adf_res)
        print("Test 2 Passed: Data Preprocessing & Stationarity Verified.")

    def test_03_feature_engineering(self):
        """
        Verify engineered lag, calendar, and rolling features have zero missing values.
        """
        self.assertIn('lag_1', self.df_transformed.columns)
        self.assertIn('rolling_mean_7', self.df_transformed.columns)
        self.assertIn('sin_month', self.df_transformed.columns)
        self.assertFalse(self.df_transformed.isnull().any().any())
        print("Test 3 Passed: Feature Engineering & Zero NaNs Verified.")

    def test_04_model_training_and_accuracy(self):
        """
        Train ML models and assert accuracy meets the >=90% goal (or R2 > 0.90 / WAPE < 0.10).
        """
        trainer = ModelTrainer()
        train_df, test_df, split_date = trainer.train_test_split_chronological(self.df_transformed, test_ratio=0.2)
        results = trainer.train_and_evaluate(train_df, test_df)

        metrics = results['metrics']
        best_acc = max(m['Accuracy_Pct'] for m in metrics.values())
        best_r2 = max(m['R2_Score'] for m in metrics.values())

        print(f"\nModel Evaluation Metrics (Test Set):")
        for name, m in metrics.items():
            print(f"  - {name}: R2={m['R2_Score']}, Accuracy={m['Accuracy_Pct']}%, WAPE={m['WAPE']}")

        self.assertGreaterEqual(best_acc, 90.0, f"Forecasting accuracy goal (>=90%) not met. Got {best_acc}%")
        self.assertGreaterEqual(best_r2, 0.85, f"R2 score should be high. Got {best_r2}")
        print("Test 4 Passed: Forecasting Accuracy Goal (>=90%) Achieved!")

    def test_05_inventory_optimization_reduction(self):
        """
        Verify dynamic inventory simulation achieves >15% stockout reduction and >10% overstock reduction.
        """
        trainer = ModelTrainer()
        train_df, test_df, _ = trainer.train_test_split_chronological(self.df_transformed, test_ratio=0.2)
        eval_res = trainer.train_and_evaluate(train_df, test_df)
        
        # Prepare evaluation df with actuals and predictions
        df_sim_input = test_df.copy()
        df_sim_input['forecast'] = eval_res['predictions']['XGBoost']

        optimizer = InventoryOptimizer(service_level=0.95, lead_time_days=3)
        sim_results = optimizer.simulate_inventory_policy(df_sim_input)

        summary = sim_results['summary']
        print(f"\nInventory Simulation Results:")
        print(f"  - Stockout Reduction: {summary['overall_stockout_reduction_pct']}% (Goal: >=15%)")
        print(f"  - Overstock Reduction: {summary['overall_overstock_reduction_pct']}% (Goal: >=10%)")
        print(f"  - Holding Cost Savings: ${summary['total_holding_cost_savings']}")

        self.assertGreaterEqual(summary['overall_stockout_reduction_pct'], 15.0, "Stockout reduction goal >=15% not met")
        self.assertGreaterEqual(summary['overall_overstock_reduction_pct'], 10.0, "Overstock reduction goal >=10% not met")
        print("Test 5 Passed: Inventory Optimization Goals (>=15% stockout, >=10% overstock reduction) Achieved!")

if __name__ == "__main__":
    unittest.main()
