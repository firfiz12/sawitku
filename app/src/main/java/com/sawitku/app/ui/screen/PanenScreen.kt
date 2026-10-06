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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Alarm
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Grass
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
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
import com.sawitku.app.data.local.entity.KebunEntity
import com.sawitku.app.data.local.entity.PanenEntity
import com.sawitku.app.ui.components.FilterOption
import com.sawitku.app.ui.components.FilterRow
import com.sawitku.app.ui.components.SawitDatePickerDialog
import com.sawitku.app.ui.components.SawitkuHeader
import com.sawitku.app.ui.theme.AmberGold
import com.sawitku.app.ui.theme.BluePenyemprotan
import com.sawitku.app.ui.theme.PrimaryEmerald
import com.sawitku.app.ui.theme.PrimaryEmeraldContainer
import com.sawitku.app.ui.theme.RedExpense
import com.sawitku.app.util.Formatters
import com.sawitku.app.util.Formatters.formatDate
import com.sawitku.app.util.Formatters.formatKg
import com.sawitku.app.util.Formatters.formatKgAndTon
import com.sawitku.app.util.Formatters.formatRupiah
import com.sawitku.app.util.PeriodeFilter
import com.sawitku.app.viewmodel.MainViewModel

@Composable
fun PanenScreen(viewModel: MainViewModel) {
    val panenList by viewModel.panenList.collectAsState()
    val kebunList by viewModel.kebunList.collectAsState()

    var showDialog by remember { mutableStateOf(false) }
    var editing by remember { mutableStateOf<PanenEntity?>(null) }
    var toDelete by remember { mutableStateOf<PanenEntity?>(null) }

    // Filter states
    var selectedKebunId by remember { mutableStateOf<String?>(null) }
    var selectedPeriode by remember { mutableStateOf(PeriodeFilter.SEMUA) }

    // Filtered data
    val filteredList = panenList.filter { p ->
        val matchKebun = selectedKebunId == null || p.kebunId == selectedKebunId
        val matchPeriode = when (selectedPeriode) {
            PeriodeFilter.SEMUA -> true
            PeriodeFilter.BULAN_INI -> Formatters.isCurrentMonth(p.tanggal)
            PeriodeFilter.TAHUN_INI -> Formatters.isCurrentYear(p.tanggal)
        }
        matchKebun && matchPeriode
    }

    val totalBeratTBSFiltered = filteredList.sumOf { it.beratKg }
    val totalBeratBrondolanFiltered = filteredList.sumOf { it.beratBrondolanKg }
    val totalBeratSemua = totalBeratTBSFiltered + totalBeratBrondolanFiltered
    val totalPendapatanFiltered = filteredList.sumOf { it.pendapatan }

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
                Icon(Icons.Filled.Add, contentDescription = "Tambah Panen")
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
                title = "Riwayat Panen",
                subtitle = "Catat tonase panen TBS, brondolan, harga jual, dan pendapatan"
            )

            // FILTER 1: Kebun
            val kebunOptions = listOf(FilterOption<String?>("Semua Kebun", null)) +
                    kebunList.map { FilterOption<String?>(it.nama, it.id) }

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

            Spacer(modifier = Modifier.height(12.dp))

            // SUMMARY CARD AKUMULASI PANEN
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "Akumulasi Panen (${filteredList.size} kali)",
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Total: ${formatKgAndTon(totalBeratSemua)}",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = PrimaryEmerald
                            )
                            if (totalBeratBrondolanFiltered > 0) {
                                Text(
                                    text = "TBS: ${formatKg(totalBeratTBSFiltered)} • Brondolan: ${formatKg(totalBeratBrondolanFiltered)}",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text(
                                text = "Total Pendapatan",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                text = formatRupiah(totalPendapatanFiltered),
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = AmberGold
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // LIST DATA PANEN
            if (filteredList.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(bottom = 64.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Tidak ada catatan panen sesuai filter.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    modifier = Modifier.fillMaxSize()
                ) {
                    items(filteredList, key = { it.id }) { p ->
                        val kebun = kebunList.find { it.id == p.kebunId }
                        PanenCardModern(
                            item = p,
                            kebunNama = kebun?.nama ?: "Semua Kebun",
                            onEdit = {
                                editing = p
                                showDialog = true
                            },
                            onDelete = { toDelete = p }
                        )
                    }
                    item { Spacer(modifier = Modifier.height(80.dp)) }
                }
            }
        }
    }

    if (showDialog) {
        PanenFormDialog(
            initial = editing,
            kebunList = kebunList,
            onDismiss = { showDialog = false },
            onSave = { entity, isEdit ->
                viewModel.savePanen(entity, isEdit)
                showDialog = false
            }
        )
    }

    toDelete?.let { p ->
        AlertDialog(
            onDismissRequest = { toDelete = null },
            title = { Text("Hapus Data Panen") },
            text = { Text("Yakin ingin menghapus catatan panen tanggal ${formatDate(p.tanggal)}?") },
            confirmButton = {
                TextButton(onClick = {
                    viewModel.deletePanen(p)
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
fun PanenCardModern(
    item: PanenEntity,
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
            // Header
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
                        color = PrimaryEmeraldContainer,
                        modifier = Modifier.size(38.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(imageVector = Icons.Default.Grass, contentDescription = null, tint = PrimaryEmerald, modifier = Modifier.size(20.dp))
                        }
                    }
                    Column {
                        Text(
                            text = kebunNama,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = formatDate(item.tanggal),
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

            Spacer(modifier = Modifier.height(10.dp))

            // TBS Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text("Berat TBS", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text(formatKg(item.beratKg), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                }

                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("Harga TBS/kg", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text("${formatRupiah(item.hargaPerKg)}/kg", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
                }

                Column(horizontalAlignment = Alignment.End) {
                    Text("Pendapatan TBS", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text(formatRupiah(item.beratKg * item.hargaPerKg), style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
                }
            }

            // Brondolan Row (if any)
            if (item.beratBrondolanKg > 0) {
                Spacer(modifier = Modifier.height(6.dp))
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = AmberGold.copy(alpha = 0.1f),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Brondolan: ${formatKg(item.beratBrondolanKg)} @ ${formatRupiah(item.hargaBrondolanPerKg)}/kg",
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Medium
                        )
                        Text(
                            text = "+ ${formatRupiah(item.pendapatanBrondolan.takeIf { it > 0 } ?: (item.beratBrondolanKg * item.hargaBrondolanPerKg))}",
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = AmberGold
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Total Pendapatan Gabungan
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Total Hasil Panen:",
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = formatRupiah(item.pendapatan),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = PrimaryEmerald
                )
            }

            if (item.biayaProduksi > 0) {
                Spacer(modifier = Modifier.height(4.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Biaya Produksi / Upah Panen:", style = MaterialTheme.typography.bodySmall, color = RedExpense)
                    Text(formatRupiah(item.biayaProduksi), style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.SemiBold, color = RedExpense)
                }
            }

            if (item.keterangan.isNotBlank()) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = item.keterangan,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            if (item.reminderEnabled && item.reminderTanggal > 0) {
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(Icons.Default.Alarm, null, modifier = Modifier.size(14.dp), tint = BluePenyemprotan)
                    Text(
                        text = "Pengingat Panen Berikutnya: ${formatDate(item.reminderTanggal)}",
                        style = MaterialTheme.typography.labelSmall,
                        color = BluePenyemprotan,
                        fontWeight = FontWeight.Medium
                    )
                }
            }
        }
    }
}

@Composable
fun PanenFormDialog(
    initial: PanenEntity?,
    kebunList: List<KebunEntity>,
    onDismiss: () -> Unit,
    onSave: (PanenEntity, Boolean) -> Unit
) {
    var tanggal by remember { mutableStateOf(initial?.tanggal ?: System.currentTimeMillis()) }
    var kebunId by remember { mutableStateOf(initial?.kebunId ?: kebunList.firstOrNull()?.id ?: "") }
    var beratKg by remember { mutableStateOf(initial?.beratKg?.takeIf { it > 0 }?.toString() ?: "") }
    var hargaPerKg by remember { mutableStateOf(initial?.hargaPerKg?.takeIf { it > 0 }?.toString() ?: "") }

    // Brondolan fields
    var beratBrondolanKg by remember { mutableStateOf(initial?.beratBrondolanKg?.takeIf { it > 0 }?.toString() ?: "") }
    var hargaBrondolanPerKg by remember { mutableStateOf(initial?.hargaBrondolanPerKg?.takeIf { it > 0 }?.toString() ?: "") }

    var biayaProduksi by remember { mutableStateOf(initial?.biayaProduksi?.takeIf { it > 0 }?.toString() ?: "") }
    var keterangan by remember { mutableStateOf(initial?.keterangan ?: "") }
    var reminderEnabled by remember { mutableStateOf(initial?.reminderEnabled ?: false) }

    // Auto calculate next harvest date based on kebun rotation days
    val selectedKebun = kebunList.find { it.id == kebunId }
    val rotationDays = selectedKebun?.rotasiPanenHari ?: 14
    var reminderTanggal by remember(kebunId) {
        mutableStateOf(
            if (initial != null && initial.reminderTanggal > 0) initial.reminderTanggal
            else tanggal + (rotationDays.toLong() * 24 * 60 * 60 * 1000)
        )
    }

    var showDatePicker by remember { mutableStateOf(false) }
    var showReminderDatePicker by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    val beratVal = beratKg.toDoubleOrNull() ?: 0.0
    val hargaVal = hargaPerKg.toDoubleOrNull() ?: 0.0
    val pendapatanTBS = beratVal * hargaVal

    val beratBrondolanVal = beratBrondolanKg.toDoubleOrNull() ?: 0.0
    val hargaBrondolanVal = hargaBrondolanPerKg.toDoubleOrNull() ?: 0.0
    val pendapatanBrondolan = beratBrondolanVal * hargaBrondolanVal

    val totalPendapatanGabungan = pendapatanTBS + pendapatanBrondolan

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                if (initial == null) "Catat Hasil Panen" else "Edit Data Panen",
                fontWeight = FontWeight.Bold
            )
        },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                OutlinedButton(
                    onClick = { showDatePicker = true },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Tanggal Panen: ${formatDate(tanggal)}")
                }

                KebunDropdownModern(
                    kebunList = kebunList,
                    selectedId = kebunId,
                    onSelect = {
                        kebunId = it
                        val k = kebunList.find { kb -> kb.id == it }
                        reminderTanggal = tanggal + ((k?.rotasiPanenHari ?: 14).toLong() * 24 * 60 * 60 * 1000)
                    }
                )

                // Input TBS
                Text("Hasil Panen TBS (Tandan Buah Segar)", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = beratKg,
                        onValueChange = { beratKg = it },
                        label = { Text("Berat TBS (kg)") },
                        placeholder = { Text("0") },
                        keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        modifier = Modifier.weight(1f)
                    )

                    OutlinedTextField(
                        value = hargaPerKg,
                        onValueChange = { hargaPerKg = it },
                        label = { Text("Harga TBS/kg") },
                        placeholder = { Text("Contoh: 2500") },
                        keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        modifier = Modifier.weight(1f)
                    )
                }

                // Input Brondolan (Opsional)
                Text("Hasil Brondolan (Opsional)", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = beratBrondolanKg,
                        onValueChange = { beratBrondolanKg = it },
                        label = { Text("Berat Brondolan (kg)") },
                        placeholder = { Text("0 (opsional)") },
                        keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        modifier = Modifier.weight(1f)
                    )

                    OutlinedTextField(
                        value = hargaBrondolanPerKg,
                        onValueChange = { hargaBrondolanPerKg = it },
                        label = { Text("Harga Brondolan/kg") },
                        placeholder = { Text("Contoh: 2600") },
                        keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        modifier = Modifier.weight(1f)
                    )
                }

                // Kalkulasi Real-time Total Pendapatan Gabungan
                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = PrimaryEmeraldContainer,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Total Pendapatan:", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.SemiBold)
                            Text(formatRupiah(totalPendapatanGabungan), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = PrimaryEmerald)
                        }
                        if (pendapatanBrondolan > 0) {
                            Text(
                                text = "Rincian: TBS ${formatRupiah(pendapatanTBS)} + Brondolan ${formatRupiah(pendapatanBrondolan)}",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }

                OutlinedTextField(
                    value = biayaProduksi,
                    onValueChange = { biayaProduksi = it },
                    label = { Text("Biaya Produksi / Upah Panen (Rp)") },
                    placeholder = { Text("0 (opsional)") },
                    keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = keterangan,
                    onValueChange = { keterangan = it },
                    label = { Text("Keterangan / PKS Tujuan (opsional)") },
                    modifier = Modifier.fillMaxWidth()
                )

                // Toggle Pengingat Panen Selanjutnya
                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = MaterialTheme.colorScheme.surfaceVariant,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                Icon(Icons.Default.NotificationsActive, null, modifier = Modifier.size(18.dp), tint = MaterialTheme.colorScheme.primary)
                                Text("Pengingat Panen Berikutnya", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.SemiBold)
                            }
                            Switch(
                                checked = reminderEnabled,
                                onCheckedChange = { reminderEnabled = it }
                            )
                        }
                        if (reminderEnabled) {
                            Spacer(modifier = Modifier.height(8.dp))
                            OutlinedButton(
                                onClick = { showReminderDatePicker = true },
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text("Waktu Alarm: ${formatDate(reminderTanggal)}")
                            }
                        }
                    }
                }

                error?.let { Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall) }
            }
        },
        confirmButton = {
            Button(onClick = {
                when {
                    kebunId.isBlank() -> error = "Pilih kebun terlebih dahulu"
                    beratVal <= 0 && beratBrondolanVal <= 0 -> error = "Masukkan berat TBS atau berat brondolan minimal lebih dari 0 kg"
                    beratVal > 0 && hargaVal <= 0 -> error = "Harga per kg TBS harus lebih dari Rp 0"
                    beratBrondolanVal > 0 && hargaBrondolanVal <= 0 -> error = "Harga per kg brondolan harus lebih dari Rp 0"
                    else -> {
                        onSave(
                            (initial ?: PanenEntity()).copy(
                                tanggal = tanggal,
                                kebunId = kebunId,
                                beratKg = beratVal,
                                hargaPerKg = hargaVal,
                                beratBrondolanKg = beratBrondolanVal,
                                hargaBrondolanPerKg = hargaBrondolanVal,
                                pendapatanBrondolan = pendapatanBrondolan,
                                pendapatan = totalPendapatanGabungan,
                                biayaProduksi = biayaProduksi.toDoubleOrNull() ?: 0.0,
                                keterangan = keterangan.trim(),
                                reminderEnabled = reminderEnabled,
                                reminderTanggal = if (reminderEnabled) reminderTanggal else 0L
                            ),
                            initial != null
                        )
                    }
                }
            }) { Text(if (initial == null) "Simpan Panen" else "Update Panen") }
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

    if (showReminderDatePicker) {
        SawitDatePickerDialog(
            initialTimestamp = reminderTanggal,
            onDismiss = { showReminderDatePicker = false },
            onDateSelected = { reminderTanggal = it }
        )
    }
}
