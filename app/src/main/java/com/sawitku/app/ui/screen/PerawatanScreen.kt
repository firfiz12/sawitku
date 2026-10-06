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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.AddRoad
import androidx.compose.material.icons.filled.Adjust
import androidx.compose.material.icons.filled.Alarm
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.ContentCut
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Foundation
import androidx.compose.material.icons.filled.Grass
import androidx.compose.material.icons.filled.MoreHoriz
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material.icons.filled.Science
import androidx.compose.material.icons.filled.Spa
import androidx.compose.material.icons.filled.ViewWeek
import androidx.compose.material.icons.filled.Water
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.sawitku.app.data.local.entity.KebunEntity
import com.sawitku.app.data.local.entity.PerawatanEntity
import com.sawitku.app.ui.components.FilterOption
import com.sawitku.app.ui.components.FilterRow
import com.sawitku.app.ui.components.SawitDatePickerDialog
import com.sawitku.app.ui.components.SawitkuHeader
import com.sawitku.app.ui.theme.BluePenyemprotan
import com.sawitku.app.ui.theme.BluePenyemprotanContainer
import com.sawitku.app.ui.theme.OrangePerbaikan
import com.sawitku.app.ui.theme.OrangePerbaikanContainer
import com.sawitku.app.ui.theme.PrimaryEmerald
import com.sawitku.app.ui.theme.PrimaryEmeraldContainer
import com.sawitku.app.ui.theme.PurpleLainnya
import com.sawitku.app.ui.theme.PurpleLainnyaContainer
import com.sawitku.app.ui.theme.RedExpense
import com.sawitku.app.ui.theme.YellowMerambah
import com.sawitku.app.ui.theme.YellowMerambahContainer
import com.sawitku.app.util.Formatters.formatDate
import com.sawitku.app.util.Formatters.formatRupiah
import com.sawitku.app.viewmodel.MainViewModel

val JENIS_PERAWATAN_LIST = listOf(
    "Pemupukan",
    "Penyemprotan",
    "Merambah (Pembersihan Gulma)",
    "Piringan",
    "Gawangan",
    "Pruning",
    "Jalan",
    "Parit & Drainase",
    "Infrastruktur",
    "Perbaikan",
    "Lainnya"
)

@Composable
fun PerawatanScreen(viewModel: MainViewModel) {
    val perawatanList by viewModel.perawatanList.collectAsState()
    val kebunList by viewModel.kebunList.collectAsState()

    var showDialog by remember { mutableStateOf(false) }
    var editing by remember { mutableStateOf<PerawatanEntity?>(null) }
    var toDelete by remember { mutableStateOf<PerawatanEntity?>(null) }

    // Filter states
    var selectedKebunId by remember { mutableStateOf<String?>(null) }
    var selectedJenis by remember { mutableStateOf("Semua") }
    var selectedSubFilter by remember { mutableStateOf<String?>(null) }

    // Apply Filters
    val filteredList = perawatanList.filter { p ->
        val matchKebun = selectedKebunId == null || p.kebunId == selectedKebunId
        val matchJenis = selectedJenis == "Semua" || p.jenis == selectedJenis
        val matchSub = when {
            selectedSubFilter == null -> true
            selectedJenis == "Pemupukan" -> p.jenisPupuk.equals(selectedSubFilter, ignoreCase = true)
            selectedJenis == "Penyemprotan" -> p.jenisRacun.equals(selectedSubFilter, ignoreCase = true)
            else -> true
        }
        matchKebun && matchJenis && matchSub
    }

    // Calculations for active filtered view
    val totalBiayaFiltered = filteredList.sumOf { it.biaya }
    val countFiltered = filteredList.size

    // Unique pupuk & racun options for sub-filters
    val pupukSet = perawatanList
        .filter { it.jenis == "Pemupukan" && it.jenisPupuk.isNotBlank() }
        .map { it.jenisPupuk.trim() }
        .distinct()

    val racunSet = perawatanList
        .filter { it.jenis == "Penyemprotan" && it.jenisRacun.isNotBlank() }
        .map { it.jenisRacun.trim() }
        .distinct()

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
                Icon(Icons.Filled.Add, contentDescription = "Tambah Perawatan")
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
                title = "Riwayat Perawatan",
                subtitle = "Catat pemupukan, semprot racun, merambah & pemeliharaan"
            )

            // FILTER 1: Kebun Filter
            val kebunOptions = listOf(FilterOption<String?>("Semua Kebun", null)) +
                    kebunList.map { FilterOption<String?>(it.nama, it.id) }

            FilterRow(
                title = "FILTER KEBUN",
                options = kebunOptions,
                selectedValue = selectedKebunId,
                onSelect = { selectedKebunId = it }
            )

            Spacer(modifier = Modifier.height(10.dp))

            // FILTER 2: Jenis Perawatan Filter
            val jenisOptions = listOf(FilterOption("Semua", "Semua", perawatanList.size)) +
                    JENIS_PERAWATAN_LIST.map { jenis ->
                        val count = perawatanList.count { it.jenis == jenis }
                        FilterOption(jenis, jenis, count)
                    }

            FilterRow(
                title = "FILTER JENIS KEGIATAN",
                options = jenisOptions,
                selectedValue = selectedJenis,
                onSelect = {
                    selectedJenis = it
                    selectedSubFilter = null // reset sub-filter on jenis change
                }
            )

            // FILTER 3: Sub-Filter for Pupuk or Racun
            if (selectedJenis == "Pemupukan" && pupukSet.isNotEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                val subOptions = listOf(FilterOption("Semua Jenis Pupuk", null as String?)) +
                        pupukSet.map { FilterOption(it, it as String?) }
                FilterRow(
                    title = "FILTER SPESIFIKASI PUPUK",
                    options = subOptions,
                    selectedValue = selectedSubFilter,
                    onSelect = { selectedSubFilter = it }
                )
            } else if (selectedJenis == "Penyemprotan" && racunSet.isNotEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                val subOptions = listOf(FilterOption("Semua Jenis Racun", null as String?)) +
                        racunSet.map { FilterOption(it, it as String?) }
                FilterRow(
                    title = "FILTER SPESIFIKASI RACUN / PESTISIDA",
                    options = subOptions,
                    selectedValue = selectedSubFilter,
                    onSelect = { selectedSubFilter = it }
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            // REKAP CARD RINGKASAN FILTER
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
                            text = "Rekap ${if (selectedJenis == "Semua") "Semua Perawatan" else selectedJenis}",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "$countFiltered catatan riwayat ditemukan",
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

            // LIST RIWAYAT PERAWATAN
            if (filteredList.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(bottom = 64.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Tidak ada catatan perawatan sesuai filter.",
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
                        PerawatanCardModern(
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
        PerawatanFormDialog(
            initial = editing,
            kebunList = kebunList,
            existingPupukList = pupukSet,
            existingRacunList = racunSet,
            onDismiss = { showDialog = false },
            onSave = { entity, isEdit ->
                viewModel.savePerawatan(entity, isEdit)
                showDialog = false
            }
        )
    }

    toDelete?.let { p ->
        AlertDialog(
            onDismissRequest = { toDelete = null },
            title = { Text("Hapus Catatan Perawatan") },
            text = { Text("Yakin ingin menghapus catatan kegiatan ${p.jenis} ini?") },
            confirmButton = {
                TextButton(onClick = {
                    viewModel.deletePerawatan(p)
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
fun PerawatanCardModern(
    item: PerawatanEntity,
    kebunNama: String,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    val (typeColor, containerColor, icon) = when (item.jenis) {
        "Pemupukan" -> Triple(PrimaryEmerald, PrimaryEmeraldContainer, Icons.Default.Spa)
        "Penyemprotan" -> Triple(BluePenyemprotan, BluePenyemprotanContainer, Icons.Default.Science)
        "Merambah (Pembersihan Gulma)" -> Triple(YellowMerambah, YellowMerambahContainer, Icons.Default.Grass)
        "Piringan" -> Triple(PrimaryEmerald, PrimaryEmeraldContainer, Icons.Default.Adjust)
        "Gawangan" -> Triple(YellowMerambah, YellowMerambahContainer, Icons.Default.ViewWeek)
        "Pruning" -> Triple(OrangePerbaikan, OrangePerbaikanContainer, Icons.Default.ContentCut)
        "Jalan" -> Triple(BluePenyemprotan, BluePenyemprotanContainer, Icons.Default.AddRoad)
        "Parit & Drainase" -> Triple(BluePenyemprotan, BluePenyemprotanContainer, Icons.Default.Water)
        "Infrastruktur" -> Triple(OrangePerbaikan, OrangePerbaikanContainer, Icons.Default.Foundation)
        "Perbaikan" -> Triple(OrangePerbaikan, OrangePerbaikanContainer, Icons.Default.Build)
        else -> Triple(PurpleLainnya, PurpleLainnyaContainer, Icons.Default.MoreHoriz)
    }

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
                        color = containerColor,
                        modifier = Modifier.size(38.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(imageVector = icon, contentDescription = null, tint = typeColor, modifier = Modifier.size(20.dp))
                        }
                    }
                    Column {
                        Text(
                            text = item.jenis,
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

            // Specific Details (Pupuk / Racun)
            if (item.jenis == "Pemupukan" && item.jenisPupuk.isNotBlank()) {
                Spacer(modifier = Modifier.height(8.dp))
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = PrimaryEmerald.copy(alpha = 0.1f)
                ) {
                    Text(
                        text = "Jenis Pupuk: ${item.jenisPupuk}",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.SemiBold,
                        color = PrimaryEmerald,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            } else if (item.jenis == "Penyemprotan" && item.jenisRacun.isNotBlank()) {
                Spacer(modifier = Modifier.height(8.dp))
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = BluePenyemprotan.copy(alpha = 0.1f)
                ) {
                    Text(
                        text = "Jenis Racun/Pestisida: ${item.jenisRacun}",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.SemiBold,
                        color = BluePenyemprotan,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
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

            Spacer(modifier = Modifier.height(10.dp))

            // Footer: Cost & Reminder Status
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (item.biaya > 0) {
                    Text(
                        text = "Biaya: ${formatRupiah(item.biaya)}",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Bold,
                        color = RedExpense
                    )
                } else {
                    Text(
                        text = "Tanpa Biaya Tambahan",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                if (item.reminderEnabled && item.reminderTanggal > 0) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(Icons.Default.Alarm, null, modifier = Modifier.size(14.dp), tint = BluePenyemprotan)
                        Text(
                            text = "Pengingat: ${formatDate(item.reminderTanggal)}",
                            style = MaterialTheme.typography.labelSmall,
                            color = BluePenyemprotan,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PerawatanFormDialog(
    initial: PerawatanEntity?,
    kebunList: List<KebunEntity>,
    existingPupukList: List<String>,
    existingRacunList: List<String>,
    onDismiss: () -> Unit,
    onSave: (PerawatanEntity, Boolean) -> Unit
) {
    var tanggal by remember { mutableStateOf(initial?.tanggal ?: System.currentTimeMillis()) }
    var kebunId by remember { mutableStateOf(initial?.kebunId ?: kebunList.firstOrNull()?.id ?: "") }
    var jenis by remember { mutableStateOf(initial?.jenis ?: JENIS_PERAWATAN_LIST.first()) }
    var jenisPupuk by remember { mutableStateOf(initial?.jenisPupuk ?: "") }
    var jenisRacun by remember { mutableStateOf(initial?.jenisRacun ?: "") }
    var deskripsi by remember { mutableStateOf(initial?.deskripsi ?: "") }
    var biaya by remember { mutableStateOf(initial?.biaya?.takeIf { it > 0 }?.toString() ?: "") }
    var reminderEnabled by remember { mutableStateOf(initial?.reminderEnabled ?: false) }
    var reminderTanggal by remember {
        mutableStateOf(
            if (initial != null && initial.reminderTanggal > 0) initial.reminderTanggal
            else System.currentTimeMillis() + (14L * 24 * 60 * 60 * 1000)
        )
    }

    var showDatePicker by remember { mutableStateOf(false) }
    var showReminderDatePicker by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                if (initial == null) "Catat Kegiatan Perawatan" else "Edit Perawatan",
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
                    Text("Tanggal Kegiatan: ${formatDate(tanggal)}")
                }

                KebunDropdownModern(kebunList = kebunList, selectedId = kebunId, onSelect = { kebunId = it })

                JenisKegiatanDropdownModern(selected = jenis, onSelect = { jenis = it })

                // Conditional: Input Jenis Pupuk
                if (jenis == "Pemupukan") {
                    OutlinedTextField(
                        value = jenisPupuk,
                        onValueChange = { jenisPupuk = it },
                        label = { Text("Jenis / Merek Pupuk") },
                        placeholder = { Text("Contoh: NPK 13-6-27, Urea, Dolomit") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                // Conditional: Input Jenis Racun
                if (jenis == "Penyemprotan") {
                    OutlinedTextField(
                        value = jenisRacun,
                        onValueChange = { jenisRacun = it },
                        label = { Text("Jenis / Merek Racun / Pestisida") },
                        placeholder = { Text("Contoh: Glifosat, Parakuat, Garlon") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                OutlinedTextField(
                    value = deskripsi,
                    onValueChange = { deskripsi = it },
                    label = { Text("Deskripsi / Catatan Tambahan (opsional)") },
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = biaya,
                    onValueChange = { biaya = it },
                    label = { Text("Biaya Perawatan (Rp)") },
                    placeholder = { Text("0") },
                    keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    modifier = Modifier.fillMaxWidth()
                )

                // Toggle Pengingat
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
                                Text("Pasang Pengingat", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.SemiBold)
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
                                Text("Waktu Pengingat: ${formatDate(reminderTanggal)}")
                            }
                        }
                    }
                }

                error?.let { Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall) }
            }
        },
        confirmButton = {
            Button(onClick = {
                if (kebunId.isBlank()) {
                    error = "Pilih kebun terlebih dahulu"
                    return@Button
                }
                val biayaVal = biaya.toDoubleOrNull() ?: 0.0
                onSave(
                    (initial ?: PerawatanEntity()).copy(
                        tanggal = tanggal,
                        kebunId = kebunId,
                        jenis = jenis,
                        jenisPupuk = if (jenis == "Pemupukan") jenisPupuk.trim() else "",
                        jenisRacun = if (jenis == "Penyemprotan") jenisRacun.trim() else "",
                        deskripsi = deskripsi.trim(),
                        biaya = biayaVal,
                        reminderEnabled = reminderEnabled,
                        reminderTanggal = if (reminderEnabled) reminderTanggal else 0L
                    ),
                    initial != null
                )
            }) { Text(if (initial == null) "Simpan Perawatan" else "Update Perawatan") }
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun KebunDropdownModern(kebunList: List<KebunEntity>, selectedId: String, onSelect: (String) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    val selectedKebun = kebunList.find { it.id == selectedId }
    ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = it }) {
        OutlinedTextField(
            value = selectedKebun?.nama ?: "Pilih Kebun",
            onValueChange = {},
            readOnly = true,
            label = { Text("Pilih Kebun") },
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
            modifier = Modifier.menuAnchor().fillMaxWidth()
        )
        ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            kebunList.forEach { kebun ->
                DropdownMenuItem(
                    text = { Text(kebun.nama) },
                    onClick = { onSelect(kebun.id); expanded = false }
                )
            }
            if (kebunList.isEmpty()) {
                DropdownMenuItem(text = { Text("Belum ada kebun terdaftar") }, onClick = {})
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun JenisKegiatanDropdownModern(selected: String, onSelect: (String) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = it }) {
        OutlinedTextField(
            value = selected,
            onValueChange = {},
            readOnly = true,
            label = { Text("Jenis Kegiatan") },
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
            modifier = Modifier.menuAnchor().fillMaxWidth()
        )
        ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            JENIS_PERAWATAN_LIST.forEach { j ->
                DropdownMenuItem(
                    text = { Text(j) },
                    onClick = { onSelect(j); expanded = false }
                )
            }
        }
    }
}
