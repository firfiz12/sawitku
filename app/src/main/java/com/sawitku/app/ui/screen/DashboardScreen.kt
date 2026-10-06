package com.sawitku.app.ui.screen

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Grass
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material.icons.filled.Paid
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.sawitku.app.data.local.entity.KebunEntity
import com.sawitku.app.ui.components.ChartBarData
import com.sawitku.app.ui.components.FilterOption
import com.sawitku.app.ui.components.FilterRow
import com.sawitku.app.ui.components.GradientCard
import com.sawitku.app.ui.components.SawitBarChart
import com.sawitku.app.ui.components.StatCard
import com.sawitku.app.ui.theme.AmberGold
import com.sawitku.app.ui.theme.AmberHeroGradient
import com.sawitku.app.ui.theme.BlueHeroGradient
import com.sawitku.app.ui.theme.BluePenyemprotan
import com.sawitku.app.ui.theme.EmeraldHeroGradient
import com.sawitku.app.ui.theme.GreenIncome
import com.sawitku.app.ui.theme.PrimaryEmerald
import com.sawitku.app.ui.theme.RedExpense
import com.sawitku.app.ui.theme.YellowMerambah
import com.sawitku.app.util.Formatters
import com.sawitku.app.util.Formatters.formatKgAndTon
import com.sawitku.app.util.Formatters.formatRupiah
import com.sawitku.app.util.Formatters.isCurrentMonth
import com.sawitku.app.util.Formatters.isCurrentYear
import com.sawitku.app.viewmodel.MainViewModel
import java.util.Calendar

@Composable
fun DashboardScreen(viewModel: MainViewModel) {
    val kebunList by viewModel.kebunList.collectAsState()
    val perawatanList by viewModel.perawatanList.collectAsState()
    val panenList by viewModel.panenList.collectAsState()
    val biayaList by viewModel.biayaList.collectAsState()

    var selectedKebunId by remember { mutableStateOf<String?>(null) }

    // Filtered data based on selected kebun
    val activePanen = if (selectedKebunId == null) panenList else panenList.filter { it.kebunId == selectedKebunId }
    val activeBiaya = if (selectedKebunId == null) biayaList else biayaList.filter { it.kebunId == selectedKebunId }
    val activePerawatan = if (selectedKebunId == null) perawatanList else perawatanList.filter { it.kebunId == selectedKebunId }

    // Month & Year calculations
    val currentMonthPanen = activePanen.filter { isCurrentMonth(it.tanggal) }
    val currentMonthBiaya = activeBiaya.filter { isCurrentMonth(it.tanggal) }
    val currentYearPanen = activePanen.filter { isCurrentYear(it.tanggal) }
    val currentYearBiaya = activeBiaya.filter { isCurrentYear(it.tanggal) }

    val pendapatanBulanIni = currentMonthPanen.sumOf { it.pendapatan }
    val pendapatanTahunIni = currentYearPanen.sumOf { it.pendapatan }

    val beratBulanIni = currentMonthPanen.sumOf { it.beratKg + it.beratBrondolanKg }
    val biayaBulanIni = currentMonthBiaya.sumOf { it.jumlah }
    val labaBulanIni = pendapatanBulanIni - biayaBulanIni

    val beratTahunIni = currentYearPanen.sumOf { it.beratKg + it.beratBrondolanKg }
    val biayaTahunIni = currentYearBiaya.sumOf { it.jumlah }
    val labaTahunIni = pendapatanTahunIni - biayaTahunIni

    val selectedKebun = kebunList.find { it.id == selectedKebunId }

    // Monthly Bar Chart Data (Last 6 Months)
    val cal = Calendar.getInstance()
    val chartData = (5 downTo 0).map { offset ->
        val c = (cal.clone() as Calendar).apply { add(Calendar.MONTH, -offset) }
        val targetMonth = c.get(Calendar.MONTH)
        val targetYear = c.get(Calendar.YEAR)
        val monthTotal = activePanen.filter { Formatters.isSameMonth(it.tanggal, targetMonth, targetYear) }
            .sumOf { it.pendapatan }
        val monthLabel = Formatters.monthShortNames[targetMonth]
        ChartBarData(
            label = monthLabel,
            value = monthTotal,
            formattedValue = formatRupiah(monthTotal)
        )
    }

    // Reminders & Upcoming Rotations
    val now = System.currentTimeMillis()
    val upcomingPerawatanReminders = activePerawatan
        .filter { it.reminderEnabled && it.reminderTanggal > 0 }
        .sortedBy { it.reminderTanggal }

    val upcomingPanenReminders = activePanen
        .filter { it.reminderEnabled && it.reminderTanggal > 0 }
        .sortedBy { it.reminderTanggal }

    // Next Harvest Estimates based on Kebun rotation
    val kebunRotations = (if (selectedKebun != null) listOf(selectedKebun) else kebunList)
        .filter { it.tanggalPanenTerakhir > 0 && it.rotasiPanenHari > 0 }
        .map { kebun ->
            val nextHarvestDate = kebun.tanggalPanenTerakhir + (kebun.rotasiPanenHari.toLong() * 24 * 60 * 60 * 1000)
            val daysDiff = ((nextHarvestDate - now) / (24 * 60 * 60 * 1000)).toInt()
            Triple(kebun, nextHarvestDate, daysDiff)
        }
        .sortedBy { it.second }

    Scaffold { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp)
                .verticalScroll(rememberScrollState())
        ) {
            Spacer(modifier = Modifier.height(16.dp))

            // App Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(
                            text = "Sawitku",
                            style = MaterialTheme.typography.headlineLarge,
                            fontWeight = FontWeight.ExtraBold,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = AmberGold.copy(alpha = 0.2f)
                        ) {
                            Text(
                                text = "Pro",
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold,
                                color = AmberGold,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }
                    Text(
                        text = "Kelola kebun kelapa sawit lebih mudah",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Surface(
                    shape = CircleShape,
                    color = MaterialTheme.colorScheme.primaryContainer,
                    modifier = Modifier.size(42.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            imageVector = Icons.Default.Grass,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(24.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Kebun Filter
            val kebunOptions = listOf(FilterOption<String?>("Semua Kebun", null)) +
                    kebunList.map { FilterOption<String?>(it.nama, it.id) }

            FilterRow(
                title = "FILTER KEBUN",
                options = kebunOptions,
                selectedValue = selectedKebunId,
                onSelect = { selectedKebunId = it }
            )

            Spacer(modifier = Modifier.height(16.dp))

            // HERO CARD: AKUMULASI PENDAPATAN
            GradientCard(
                brush = EmeraldHeroGradient,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = if (selectedKebunId == null) "TOTAL PENDAPATAN BULAN INI" else "PENDAPATAN ${selectedKebun?.nama?.uppercase()} (BULAN INI)",
                            style = MaterialTheme.typography.labelMedium,
                            color = Color.White.copy(alpha = 0.85f),
                            fontWeight = FontWeight.SemiBold
                        )
                        Text(
                            text = formatRupiah(pendapatanBulanIni),
                            style = MaterialTheme.typography.headlineLarge,
                            fontWeight = FontWeight.ExtraBold,
                            color = Color.White
                        )
                    }
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = Color.White.copy(alpha = 0.2f),
                        modifier = Modifier.size(44.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = Icons.Default.Paid,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(26.dp)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(1.dp)
                        .background(Color.White.copy(alpha = 0.2f))
                )
                Spacer(modifier = Modifier.height(12.dp))

                // Annual Cumulative & Net Profit
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Akumulasi Tahun ${Calendar.getInstance().get(Calendar.YEAR)}",
                            style = MaterialTheme.typography.labelSmall,
                            color = Color.White.copy(alpha = 0.8f)
                        )
                        Text(
                            text = formatRupiah(pendapatanTahunIni),
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = AmberGold
                        )
                    }

                    Column(modifier = Modifier.weight(1f), horizontalAlignment = Alignment.End) {
                        Text(
                            text = "Laba Bersih Bulan Ini",
                            style = MaterialTheme.typography.labelSmall,
                            color = Color.White.copy(alpha = 0.8f)
                        )
                        Text(
                            text = formatRupiah(labaBulanIni),
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = if (labaBulanIni >= 0) Color(0xFF86EFAC) else Color(0xFFFCA5A5)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // 4 Grid Ringkasan Bulan Ini
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                StatCard(
                    title = "Total Panen (Bulan)",
                    value = formatKgAndTon(beratBulanIni),
                    subtitle = "${currentMonthPanen.size} kali panen",
                    icon = Icons.Default.Grass,
                    accentColor = PrimaryEmerald,
                    modifier = Modifier.weight(1f)
                )

                StatCard(
                    title = "Total Biaya (Bulan)",
                    value = formatRupiah(biayaBulanIni),
                    subtitle = "${currentMonthBiaya.size} transaksi",
                    icon = Icons.Default.Paid,
                    accentColor = RedExpense,
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                StatCard(
                    title = "Panen Sepanjang Tahun",
                    value = formatKgAndTon(beratTahunIni),
                    subtitle = "${currentYearPanen.size} kali panen",
                    icon = Icons.Default.CalendarMonth,
                    accentColor = AmberGold,
                    modifier = Modifier.weight(1f)
                )

                StatCard(
                    title = "Laba Bersih Tahunan",
                    value = formatRupiah(labaTahunIni),
                    subtitle = if (labaTahunIni >= 0) "Surplus" else "Defisit",
                    icon = Icons.Default.TrendingUp,
                    accentColor = if (labaTahunIni >= 0) GreenIncome else RedExpense,
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            // SECTION: PENGINGAT & JADWAL ROTASI PANEN
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = AmberGold.copy(alpha = 0.15f),
                                modifier = Modifier.size(32.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(
                                        imageVector = Icons.Default.NotificationsActive,
                                        contentDescription = null,
                                        tint = AmberGold,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            }
                            Column {
                                Text(
                                    text = "Jadwal & Pengingat",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "Rotasi panen & agenda perawatan kebun",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    if (kebunRotations.isEmpty() && upcomingPerawatanReminders.isEmpty() && upcomingPanenReminders.isEmpty()) {
                        Text(
                            text = "Belum ada jadwal aktif. Masukkan riwayat panen dan rotasi hari pada data kebun untuk estimasi otomatis.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    } else {
                        // Display Kebun Rotations
                        kebunRotations.take(3).forEach { (kebun, nextDate, daysDiff) ->
                            val statusText = when {
                                daysDiff < 0 -> "Lewat ${-daysDiff} hari"
                                daysDiff == 0 -> "Hari Ini!"
                                else -> "$daysDiff hari lagi"
                            }
                            val statusColor = when {
                                daysDiff <= 0 -> RedExpense
                                daysDiff <= 3 -> AmberGold
                                else -> PrimaryEmerald
                            }

                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 6.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(8.dp)
                                            .background(statusColor, CircleShape)
                                    )
                                    Column {
                                        Text(
                                            text = "Panen: ${kebun.nama}",
                                            style = MaterialTheme.typography.bodyMedium,
                                            fontWeight = FontWeight.SemiBold
                                        )
                                        Text(
                                            text = "Estimasi: ${Formatters.formatDate(nextDate)} (rotasi ${kebun.rotasiPanenHari} hr)",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                                Surface(
                                    shape = RoundedCornerShape(8.dp),
                                    color = statusColor.copy(alpha = 0.15f)
                                ) {
                                    Text(
                                        text = statusText,
                                        style = MaterialTheme.typography.labelSmall,
                                        fontWeight = FontWeight.Bold,
                                        color = statusColor,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                    )
                                }
                            }
                        }

                        // Display Perawatan Reminders
                        upcomingPerawatanReminders.take(2).forEach { p ->
                            val kebun = kebunList.find { it.id == p.kebunId }
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 6.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(8.dp)
                                            .background(BluePenyemprotan, CircleShape)
                                    )
                                    Column {
                                        Text(
                                            text = "Perawatan: ${p.jenis} (${kebun?.nama ?: "Kebun"})",
                                            style = MaterialTheme.typography.bodyMedium,
                                            fontWeight = FontWeight.SemiBold
                                        )
                                        Text(
                                            text = "Pengingat: ${Formatters.formatDate(p.reminderTanggal)}",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                                Surface(
                                    shape = RoundedCornerShape(8.dp),
                                    color = BluePenyemprotan.copy(alpha = 0.15f)
                                ) {
                                    Text(
                                        text = "Alarm Aktif",
                                        style = MaterialTheme.typography.labelSmall,
                                        fontWeight = FontWeight.Bold,
                                        color = BluePenyemprotan,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // SECTION: GRAFIK PENDAPATAN 6 BULAN TERAKHIR
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "Tren Pendapatan Panen",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "6 Bulan Terakhir",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    SawitBarChart(
                        data = chartData,
                        gradientColors = listOf(PrimaryEmerald, PrimaryEmerald.copy(alpha = 0.5f)),
                        height = 180.dp
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}
