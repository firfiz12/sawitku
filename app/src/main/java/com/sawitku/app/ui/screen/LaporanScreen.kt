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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Grass
import androidx.compose.material.icons.filled.Paid
import androidx.compose.material.icons.filled.PieChart
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.sawitku.app.ui.components.ChartBarData
import com.sawitku.app.ui.components.DonutSliceData
import com.sawitku.app.ui.components.FilterOption
import com.sawitku.app.ui.components.FilterRow
import com.sawitku.app.ui.components.SawitBarChart
import com.sawitku.app.ui.components.SawitDonutChart
import com.sawitku.app.ui.components.SawitkuHeader
import com.sawitku.app.ui.components.StatCard
import com.sawitku.app.ui.theme.AmberGold
import com.sawitku.app.ui.theme.BluePenyemprotan
import com.sawitku.app.ui.theme.GreenIncome
import com.sawitku.app.ui.theme.OrangePerbaikan
import com.sawitku.app.ui.theme.PrimaryEmerald
import com.sawitku.app.ui.theme.PurpleLainnya
import com.sawitku.app.ui.theme.RedExpense
import com.sawitku.app.ui.theme.YellowMerambah
import com.sawitku.app.util.Formatters
import com.sawitku.app.util.Formatters.formatKgAndTon
import com.sawitku.app.util.Formatters.formatRupiah
import com.sawitku.app.viewmodel.MainViewModel
import java.util.Calendar

@Composable
fun LaporanScreen(viewModel: MainViewModel) {
    val perawatanList by viewModel.perawatanList.collectAsState()
    val panenList by viewModel.panenList.collectAsState()
    val biayaList by viewModel.biayaList.collectAsState()
    val kebunList by viewModel.kebunList.collectAsState()

    val currentYear = Calendar.getInstance().get(Calendar.YEAR)

    // Filter states
    var selectedKebunId by remember { mutableStateOf<String?>(null) }
    var selectedYear by remember { mutableStateOf(currentYear) }

    // Distinct years available
    val availableYears = (listOf(currentYear) +
            panenList.map { Formatters.getYear(it.tanggal) } +
            biayaList.map { Formatters.getYear(it.tanggal) })
        .distinct()
        .sortedDescending()

    // Filtered data by kebun and year
    val filteredPanen = panenList.filter { p ->
        val matchKebun = selectedKebunId == null || p.kebunId == selectedKebunId
        val matchYear = Formatters.isSameYear(p.tanggal, selectedYear)
        matchKebun && matchYear
    }

    val filteredBiaya = biayaList.filter { b ->
        val matchKebun = selectedKebunId == null || b.kebunId == selectedKebunId
        val matchYear = Formatters.isSameYear(b.tanggal, selectedYear)
        matchKebun && matchYear
    }

    val filteredPerawatan = perawatanList.filter { p ->
        val matchKebun = selectedKebunId == null || p.kebunId == selectedKebunId
        val matchYear = Formatters.isSameYear(p.tanggal, selectedYear)
        matchKebun && matchYear
    }

    val totalPanenKg = filteredPanen.sumOf { it.beratKg + it.beratBrondolanKg }
    val totalPendapatan = filteredPanen.sumOf { it.pendapatan }
    val totalBiaya = filteredBiaya.sumOf { it.jumlah }
    val labaBersih = totalPendapatan - totalBiaya

    // 12 Months Bar Chart Data
    val monthlyChartData = (0..11).map { monthIndex ->
        val monthTotal = filteredPanen
            .filter { Formatters.getMonth(it.tanggal) == monthIndex }
            .sumOf { it.pendapatan }
        ChartBarData(
            label = Formatters.monthShortNames[monthIndex],
            value = monthTotal,
            formattedValue = formatRupiah(monthTotal)
        )
    }

    // Pie/Donut Chart Slice Data
    val sliceColors = listOf(
        PrimaryEmerald,
        BluePenyemprotan,
        YellowMerambah,
        OrangePerbaikan,
        RedExpense,
        PurpleLainnya,
        AmberGold
    )
    val groupedBiaya = filteredBiaya
        .groupBy { it.kategori }
        .mapValues { entry -> entry.value.sumOf { it.jumlah } }

    val donutSlices = groupedBiaya.entries.mapIndexed { index, (cat, amount) ->
        DonutSliceData(
            label = cat,
            value = amount,
            color = sliceColors[index % sliceColors.size]
        )
    }

    Scaffold { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp)
                .verticalScroll(rememberScrollState())
        ) {
            Spacer(modifier = Modifier.height(16.dp))

            SawitkuHeader(
                title = "Laporan & Analitik",
                subtitle = "Evaluasi performa produksi dan keuangan kebun"
            )

            // FILTER 1: Tahun
            val yearOptions = availableYears.map { FilterOption("Tahun $it", it) }
            FilterRow(
                title = "FILTER TAHUN",
                options = yearOptions,
                selectedValue = selectedYear,
                onSelect = { selectedYear = it }
            )

            Spacer(modifier = Modifier.height(8.dp))

            // FILTER 2: Kebun
            val kebunOptions = listOf(FilterOption<String?>("Semua Kebun", null)) +
                    kebunList.map { FilterOption<String?>(it.nama, it.id) }

            FilterRow(
                title = "FILTER KEBUN",
                options = kebunOptions,
                selectedValue = selectedKebunId,
                onSelect = { selectedKebunId = it }
            )

            Spacer(modifier = Modifier.height(16.dp))

            // 4 Stat Cards
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                StatCard(
                    title = "Total Panen ($selectedYear)",
                    value = formatKgAndTon(totalPanenKg),
                    subtitle = "${filteredPanen.size} kali panen",
                    icon = Icons.Default.Grass,
                    accentColor = PrimaryEmerald,
                    modifier = Modifier.weight(1f)
                )

                StatCard(
                    title = "Total Pendapatan",
                    value = formatRupiah(totalPendapatan),
                    subtitle = "Tahun $selectedYear",
                    icon = Icons.Default.Paid,
                    accentColor = AmberGold,
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                StatCard(
                    title = "Total Pengeluaran",
                    value = formatRupiah(totalBiaya),
                    subtitle = "${filteredBiaya.size} transaksi",
                    icon = Icons.Default.PieChart,
                    accentColor = RedExpense,
                    modifier = Modifier.weight(1f)
                )

                StatCard(
                    title = "Laba Bersih ($selectedYear)",
                    value = formatRupiah(labaBersih),
                    subtitle = if (labaBersih >= 0) "Surplus" else "Defisit",
                    icon = Icons.Default.TrendingUp,
                    accentColor = if (labaBersih >= 0) GreenIncome else RedExpense,
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            // SECTION: GRAFIK PENDAPATAN BULANAN (12 BULAN)
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
                                text = "Pendapatan per Bulan ($selectedYear)",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Grafik distribusi penjualan TBS setiap bulan",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    SawitBarChart(
                        data = monthlyChartData,
                        gradientColors = listOf(PrimaryEmerald, PrimaryEmerald.copy(alpha = 0.4f)),
                        height = 200.dp
                    )
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // SECTION: DISTRIBUSI BIAYA OPERASIONAL (DONUT CHART)
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Distribusi Biaya per Kategori ($selectedYear)",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Komposisi pengeluaran perawatan dan operasional",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    if (donutSlices.isEmpty() || donutSlices.all { it.value <= 0 }) {
                        Text(
                            text = "Belum ada catatan biaya untuk tahun $selectedYear.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(vertical = 16.dp)
                        )
                    } else {
                        SawitDonutChart(
                            slices = donutSlices,
                            centerTitle = "Total Biaya $selectedYear",
                            height = 220.dp
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // SECTION: REKAPITULASI AKTIVITAS
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Ringkasan Aktivitas Kebun ($selectedYear)",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("• Kegiatan Perawatan:", style = MaterialTheme.typography.bodyMedium)
                        Text("${filteredPerawatan.size} catatan", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold)
                    }
                    Spacer(modifier = Modifier.height(6.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("• Kegiatan Panen:", style = MaterialTheme.typography.bodyMedium)
                        Text("${filteredPanen.size} transaksi", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold)
                    }
                    Spacer(modifier = Modifier.height(6.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("• Transaksi Biaya:", style = MaterialTheme.typography.bodyMedium)
                        Text("${filteredBiaya.size} transaksi", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold)
                    }
                }
            }

            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}
