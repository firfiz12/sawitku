package com.sawitku.app.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.Grass
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Nature
import androidx.compose.material.icons.filled.Paid
import androidx.compose.material.icons.filled.Spa
import androidx.compose.material.icons.outlined.BarChart
import androidx.compose.material.icons.outlined.Grass
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Nature
import androidx.compose.material.icons.outlined.Paid
import androidx.compose.material.icons.outlined.Spa
import androidx.compose.ui.graphics.vector.ImageVector

sealed class Screen(
    val route: String,
    val label: String,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector
) {
    data object Home : Screen("home", "Dashboard", Icons.Filled.Home, Icons.Outlined.Home)
    data object Kebun : Screen("kebun", "Kebun", Icons.Filled.Nature, Icons.Outlined.Nature)
    data object Perawatan : Screen("perawatan", "Perawatan", Icons.Filled.Spa, Icons.Outlined.Spa)
    data object Panen : Screen("panen", "Panen", Icons.Filled.Grass, Icons.Outlined.Grass)
    data object Biaya : Screen("biaya", "Pengeluaran", Icons.Filled.Paid, Icons.Outlined.Paid)
    data object Laporan : Screen("laporan", "Laporan", Icons.Filled.BarChart, Icons.Outlined.BarChart)
}

val bottomNavScreens = listOf(
    Screen.Home,
    Screen.Kebun,
    Screen.Perawatan,
    Screen.Panen,
    Screen.Biaya,
    Screen.Laporan
)
