package com.sawitku.app.ui.screen

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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Paid
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
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
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.sawitku.app.data.local.entity.BiayaEntity
import com.sawitku.app.data.local.entity.KebunEntity
import com.sawitku.app.ui.components.FilterOption
import com.sawitku.app.ui.components.FilterRow
import com.sawitku.app.ui.components.SawitDatePickerDialog
import com.sawitku.app.ui.components.SawitkuHeader
import com.sawitku.app.ui.theme.RedExpense
import com.sawitku.app.ui.theme.RedExpenseContainer
import com.sawitku.app.util.Formatters
import com.sawitku.app.util.Formatters.formatDate
import com.sawitku.app.util.Formatters.formatRupiah
import com.sawitku.app.util.PeriodeFilter
import com.sawitku.app.viewmodel.MainViewModel

private val KATEGORI_BIAYA_DEFAULT = listOf("Peralatan", "Sewa", "Tenaga Kerja", "Transportasi", "Lainnya")

@Composable
fun BiayaScreen(viewModel: MainViewModel) {
    val biayaList by viewModel.biayaList.collectAsState()
    val kebunList by viewModel.kebunList.collectAsState()

    var showDialog by remember { mutableStateOf(false) }
    var editing by remember { mutableStateOf<BiayaEntity?>(null) }
    var toDelete by remember { mutableStateOf<BiayaEntity?>(null) }

    // Filter states
    var selectedKebunId by remember { mutableStateOf<Long?>(null) }
    var selectedKategori by remember { mutableStateOf("Semua") }
    var selectedPeriode by remember { mutableStateOf(PeriodeFilter.SEMUA) }

    // Unique categories from data
    val allKategoriOptions = (listOf("Semua") + (KATEGORI_BIAYA_DEFAULT + biayaList.map { it.kategori }).distinct()).distinct()

    // Filtered data
    val filteredList = biayaList.filter { b ->
        val matchKebun = selectedKebunId == null || b.kebunId == selectedKebunId
        val matchKategori = selectedKategori == "Semua" || b.kategori.contains(selectedKategori, ignoreCase = true)
        val matchPeriode = when (selectedPeriode) {
            PeriodeFilter.SEMUA -> true
            PeriodeFilter.BULAN_INI -> Formatters.isCurrentMonth(b.tanggal)
            PeriodeFilter.TAHUN_INI -> Formatters.isCurrentYear(b.tanggal)
        }
        matchKebun && matchKategori && matchPeriode
    }

    val totalBiayaFiltered = filteredList.sumOf { it.jumlah }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = {
                    editing = null
                    showDialog = true
                },
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = Color.White
            ) {
                Icon(Icons.Filled.Add, contentDescription = "Tambah Biaya")
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp)
        ) {
            Spacer(modifier = Modifier.height(16.dp))

            SawitkuHeader(
                title = "Pengeluaran",
                subtitle = "Kelola biaya operasional, perawatan kebun & pengeluaran mandiri"
            )

            // FILTER 1: Kebun
            val kebunOptions = listOf(FilterOption("Semua Kebun", null as Long?)) +
                    kebunList.map { FilterOption(it.nama, it.id as Long?) }

            FilterRow(
                title = "FILTER KEBUN",
                options = kebunOptions,
                selectedValue = selectedKebunId,
                onSelect = { selectedKebunId = it }
            )

            Spacer(modifier = Modifier.height(8.dp))

            // FILTER 2: Periode
            val periodeOptions = listOf(
                FilterOption("Semua Riwayat", PeriodeFilter.SEMUA),
                FilterOption("Bulan Ini", PeriodeFilter.BULAN_INI),
                FilterOption("Tahun Ini", PeriodeFilter.TAHUN_INI)
            )

            FilterRow(
                title = "FILTER PERIODE",
                options = periodeOptions,
                selectedValue = selectedPeriode,
                onSelect = { selectedPeriode = it }
            )

            Spacer(modifier = Modifier.height(8.dp))

            // FILTER 3: Kategori Biaya
            val kategoriFilterOptions = allKategoriOptions.map {
                val count = if (it == "Semua") biayaList.size else biayaList.count { b -> b.kategori.contains(it, ignoreCase = true) }
                FilterOption(it, it, count)
            }

            FilterRow(
                title = "FILTER KATEGORI BIAYA",
                options = kategoriFilterOptions,
                selectedValue = selectedKategori,
                onSelect = { selectedKategori = it }
            )

            Spacer(modifier = Modifier.height(12.dp))

            // SUMMARY CARD
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp, vertical = 10.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Rekap Pengeluaran",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "${filteredList.size} transaksi tercatat",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Column(horizontalAlignment = Alignment.End) {
                        Text(
                            text = "Total Biaya",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = formatRupiah(totalBiayaFiltered),
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = RedExpense
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // LIST BIAYA
            if (filteredList.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(bottom = 64.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Tidak ada catatan biaya sesuai filter.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    modifier = Modifier.fillMaxSize()
                ) {
                    items(filteredList, key = { it.id }) { b ->
                        val kebun = kebunList.find { it.id == b.kebunId }
                        BiayaCardModern(
                            item = b,
                            kebunNama = kebun?.nama ?: "Biaya Umum",
                            onEdit = {
                                editing = b
                                showDialog = true
                            },
                            onDelete = { toDelete = b }
                        )
                    }
                    item { Spacer(modifier = Modifier.height(80.dp)) }
                }
            }
        }
    }

    if (showDialog) {
        BiayaFormDialog(
            initial = editing,
            kebunList = kebunList,
            onDismiss = { showDialog = false },
            onSave = { entity, isEdit ->
                viewModel.saveBiaya(entity, isEdit)
                showDialog = false
            }
        )
    }

    toDelete?.let { b ->
        AlertDialog(
            onDismissRequest = { toDelete = null },
            title = { Text("Hapus Catatan Biaya") },
            text = { Text("Yakin ingin menghapus biaya ${b.kategori} sebesar ${formatRupiah(b.jumlah)}?") },
            confirmButton = {
                TextButton(onClick = {
                    viewModel.deleteBiaya(b)
                    toDelete = null
                }) { Text("Hapus", color = MaterialTheme.colorScheme.error) }
            },
            dismissButton = {
                TextButton(onClick = { toDelete = null }) { Text("Batal") }
            }
        )
    }
}

@Composable
fun BiayaCardModern(
    item: BiayaEntity,
    kebunNama: String,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = RedExpenseContainer,
                        modifier = Modifier.size(38.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(imageVector = Icons.Default.Paid, contentDescription = null, tint = RedExpense, modifier = Modifier.size(20.dp))
                        }
                    }
                    Column {
                        Text(
                            text = item.kategori,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "$kebunNama • ${formatDate(item.tanggal)}",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                Row {
                    IconButton(onClick = onEdit) {
                        Icon(Icons.Filled.Edit, "Edit", tint = MaterialTheme.colorScheme.primary)
                    }
                    IconButton(onClick = onDelete) {
                        Icon(Icons.Filled.Delete, "Hapus", tint = RedExpense)
                    }
                }
            }

            if (item.deskripsi.isNotBlank()) {
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = item.deskripsi,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End
            ) {
                Text(
                    text = formatRupiah(item.jumlah),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = RedExpense
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BiayaFormDialog(
    initial: BiayaEntity?,
    kebunList: List<KebunEntity>,
    onDismiss: () -> Unit,
    onSave: (BiayaEntity, Boolean) -> Unit
) {
    var tanggal by remember { mutableStateOf(initial?.tanggal ?: System.currentTimeMillis()) }
    var kebunId by remember { mutableStateOf(initial?.kebunId) }
    var kategori by remember { mutableStateOf(initial?.kategori ?: KATEGORI_BIAYA_DEFAULT.first()) }
    var deskripsi by remember { mutableStateOf(initial?.deskripsi ?: "") }
    var jumlah by remember { mutableStateOf(initial?.jumlah?.takeIf { it > 0 }?.toString() ?: "") }
    var showDatePicker by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (initial == null) "Tambah Biaya Mandiri" else "Edit Biaya", fontWeight = FontWeight.Bold) },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                OutlinedButton(
                    onClick = { showDatePicker = true },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Tanggal: ${formatDate(tanggal)}")
                }

                // Opsional Pilih Kebun
                KebunDropdownOptionalModern(
                    kebunList = kebunList,
                    selectedId = kebunId,
                    onSelect = { kebunId = it }
                )

                KategoriBiayaDropdownModern(selected = kategori, onSelect = { kategori = it })

                OutlinedTextField(
                    value = jumlah,
                    onValueChange = { jumlah = it },
                    label = { Text("Jumlah Pengeluaran (Rp)") },
                    placeholder = { Text("0") },
                    keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = deskripsi,
                    onValueChange = { deskripsi = it },
                    label = { Text("Deskripsi / Keperluan") },
                    placeholder = { Text("Contoh: Pembelian dodos, perbaikan jembatan") },
                    modifier = Modifier.fillMaxWidth()
                )

                error?.let { Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall) }
            }
        },
        confirmButton = {
            Button(onClick = {
                val jumlahVal = jumlah.toDoubleOrNull()
                if (jumlahVal == null || jumlahVal <= 0) {
                    error = "Jumlah pengeluaran harus lebih dari Rp 0"
                } else {
                    onSave(
                        (initial ?: BiayaEntity()).copy(
                            id = initial?.id ?: 0,
                            tanggal = tanggal,
                            kebunId = kebunId,
                            kategori = kategori.trim(),
                            deskripsi = deskripsi.trim(),
                            jumlah = jumlahVal
                        ),
                        initial != null
                    )
                }
            }) { Text(if (initial == null) "Simpan Biaya" else "Update Biaya") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Batal") } }
    )

    if (showDatePicker) {
        SawitDatePickerDialog(
            initialTimestamp = tanggal,
            onDismiss = { showDatePicker = false },
            onDateSelected = { tanggal = it }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun KebunDropdownOptionalModern(
    kebunList: List<KebunEntity>,
    selectedId: Long?,
    onSelect: (Long?) -> Unit
) {
    var expanded by remember { mutableStateOf(false) }
    val selectedKebun = kebunList.find { it.id == selectedId }
    ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = it }) {
        OutlinedTextField(
            value = selectedKebun?.nama ?: "Biaya Umum (Semua Kebun)",
            onValueChange = {},
            readOnly = true,
            label = { Text("Kebun Terkait (opsional)") },
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
            modifier = Modifier.menuAnchor().fillMaxWidth()
        )
        ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            DropdownMenuItem(
                text = { Text("Biaya Umum (Semua Kebun)") },
                onClick = { onSelect(null); expanded = false }
            )
            kebunList.forEach { kebun ->
                DropdownMenuItem(
                    text = { Text(kebun.nama) },
                    onClick = { onSelect(kebun.id); expanded = false }
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun KategoriBiayaDropdownModern(selected: String, onSelect: (String) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = it }) {
        OutlinedTextField(
            value = selected,
            onValueChange = {},
            readOnly = true,
            label = { Text("Kategori Biaya") },
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
            modifier = Modifier.menuAnchor().fillMaxWidth()
        )
        ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            KATEGORI_BIAYA_DEFAULT.forEach { k ->
                DropdownMenuItem(
                    text = { Text(k) },
                    onClick = { onSelect(k); expanded = false }
                )
            }
        }
    }
}
