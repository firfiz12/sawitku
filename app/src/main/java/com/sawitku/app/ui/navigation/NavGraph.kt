package com.sawitku.app.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.NavHostController
import androidx.navigation.compose.rememberNavController
import com.sawitku.app.ui.screen.BiayaScreen
import com.sawitku.app.ui.screen.DashboardScreen
import com.sawitku.app.ui.screen.KebunScreen
import com.sawitku.app.ui.screen.LaporanScreen
import com.sawitku.app.ui.screen.PanenScreen
import com.sawitku.app.ui.screen.PerawatanScreen
import com.sawitku.app.viewmodel.MainViewModel

@Composable
fun MainNavHost(
    navController: NavHostController = rememberNavController(),
    viewModel: MainViewModel
) {
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route

    NavHost(navController = navController, startDestination = Screen.Home.route) {
        composable(Screen.Home.route) {
            DashboardScreen(viewModel = viewModel)
        }
        composable(Screen.Kebun.route) {
            KebunScreen(viewModel = viewModel)
        }
        composable(Screen.Perawatan.route) {
            PerawatanScreen(viewModel = viewModel)
        }
        composable(Screen.Panen.route) {
            PanenScreen(viewModel = viewModel)
        }
        composable(Screen.Biaya.route) {
            BiayaScreen(viewModel = viewModel)
        }
        composable(Screen.Laporan.route) {
            LaporanScreen(viewModel = viewModel)
        }
    }
}
