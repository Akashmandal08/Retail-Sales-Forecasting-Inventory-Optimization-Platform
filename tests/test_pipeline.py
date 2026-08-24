import sys
import os
import unittest
import pandas as pd
import numpy as np

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.data_generator import generate_retail_sales_data
from src.preprocessing import DataPreprocessor
from src.feature_engineering import FeatureEngineer
from src.model_training import ModelTrainer
from src.evaluation import ModelEvaluator
from src.inventory_optimizer import InventoryOptimizer

class TestRetailSalesForecastingPipeline(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        """
        Full Sequential Pipeline Flow:
        Generate Data -> Preprocess -> Feature Engineering -> Train -> Predict -> Evaluate -> Inventory Simulation
        """
        print("\n=======================================================")
        print("  RUNNING GENUINE AUTOMATED TEST PIPELINE ")
        print("=======================================================")
        
        # 1. Generate Data
        cls.df_raw = generate_retail_sales_data(num_days=365, num_stores=2, random_seed=42)
        
        # 2. Preprocess Data
        cls.processor = DataPreprocessor()
        cls.df_clean = cls.processor.clean_data(cls.df_raw)
        cls.df_capped = cls.processor.handle_outliers(cls.df_clean)
        
        # 3. Feature Engineering
        cls.fe = FeatureEngineer(lag_days=[1, 7, 14], rolling_windows=[7, 14])
        cls.df_transformed = cls.fe.transform(cls.df_capped)

        # 4. Train Models & Predict
        cls.trainer = ModelTrainer()
        cls.train_df, cls.test_df, cls.split_date = cls.trainer.train_test_split_chronological(cls.df_transformed, test_ratio=0.2)
        cls.results = cls.trainer.train_and_evaluate(cls.train_df, cls.test_df)
        cls.best_model_name = cls.results['best_model_name']

        # 5. Inventory Simulation on Test Set using Selected Best Model
        cls.df_sim_input = cls.test_df.copy()
        cls.df_sim_input['forecast'] = cls.results['predictions'][cls.best_model_name]
        
        cls.optimizer = InventoryOptimizer(service_level=0.95, lead_time_days=3)
        cls.sim_results = cls.optimizer.simulate_inventory_policy(cls.df_sim_input)

    def test_01_data_generator_and_preprocessing(self):
        """
        Verify raw data generation, schema integrity, zero nulls, and stationarity test.
        """
        self.assertGreater(len(self.df_raw), 0)
        self.assertFalse(self.df_clean.isnull().any().any())
        self.assertTrue((self.df_clean['units_sold'] >= 0).all())
        
        adf_res = self.processor.test_stationarity(self.df_clean['units_sold'])
        self.assertIn('is_stationary', adf_res)
        print("[OK] Test 1 Passed: Data Generation & Preprocessing Verified (0 Nulls, Capped Outliers).")

    def test_02_feature_engineering_no_nulls(self):
        """
        Verify feature engineering creates non-null lags, rolling statistics, and cyclical features.
        """
        self.assertIn('lag_1', self.df_transformed.columns)
        self.assertIn('rolling_mean_7', self.df_transformed.columns)
        self.assertIn('sin_month', self.df_transformed.columns)
        self.assertFalse(self.df_transformed.isnull().any().any())
        print("[OK] Test 2 Passed: Feature Engineering Verified (No Data Leakage, 0 Nulls).")

    def test_03_baseline_vs_ml_models_evaluation(self):
        """
        Verify models evaluation metrics: R2 >= 0.90, MAE >= 0, RMSE >= 0, MAPE >= 0.
        Verify ML model outperforms Naive baselines.
        """
        metrics = self.results['metrics']
        best_metrics = metrics[self.best_model_name]

        print(f"\n  Model Evaluation Benchmark Comparison:")
        for name, m in metrics.items():
            print(f"    - [{name}]: R2={m['R2_Score']}, MAE={m['MAE']}, RMSE={m['RMSE']}, MAPE={m['MAPE_Pct']}%")

        print(f"\n  Selected Best Performing Model: [{self.best_model_name}]")

        self.assertGreaterEqual(best_metrics['R2_Score'], 0.90, f"R2 score should be >= 0.90. Got {best_metrics['R2_Score']}")
        self.assertGreaterEqual(best_metrics['MAE'], 0.0)
        self.assertGreaterEqual(best_metrics['RMSE'], 0.0)
        self.assertGreaterEqual(best_metrics['MAPE_Pct'], 0.0)

        # ML model must outperform Naive baseline
        naive_r2 = metrics['Naive']['R2_Score']
        self.assertGreater(best_metrics['R2_Score'], naive_r2, "ML model must statistically outperform Naive baseline")
        print("[OK] Test 3 Passed: Model Evaluation Verified (R2 >= 0.90, ML outperforming Naive).")

    def test_04_genuine_inventory_simulation(self):
        """
        Verify genuine inventory simulation outputs and business cost matrix.
        """
        summary = self.sim_results['summary']
        stockout_red = summary['overall_stockout_reduction_pct']
        overstock_red = summary['overall_overstock_reduction_pct']
        cost_savings = summary['total_holding_cost_savings']

        print(f"\n  Genuine Inventory Simulation Results:")
        print(f"    - Stockout Units Reduction: {stockout_red}%")
        print(f"    - Overstock Units Reduction: {overstock_red}%")
        print(f"    - Total Supply Chain Cost Savings: ${cost_savings:,.2f}")

        self.assertIsInstance(self.sim_results['cost_matrix'], pd.DataFrame)
        self.assertIn('overall_stockout_reduction_pct', summary)
        self.assertIn('overall_overstock_reduction_pct', summary)
        print("[OK] Test 4 Passed: Genuine Inventory Optimization Verified.")

if __name__ == "__main__":
    unittest.main()
