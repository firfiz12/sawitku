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
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Nature
import androidx.compose.material.icons.filled.Park
import androidx.compose.material.icons.filled.Repeat
import androidx.compose.material.icons.filled.SquareFoot
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
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
import com.sawitku.app.data.local.entity.KebunEntity
import com.sawitku.app.ui.components.SawitkuHeader
import com.sawitku.app.ui.theme.AmberGold
import com.sawitku.app.ui.theme.PrimaryEmerald
import com.sawitku.app.ui.theme.RedExpense
import com.sawitku.app.util.Formatters
import com.sawitku.app.viewmodel.MainViewModel

@Composable
fun KebunScreen(viewModel: MainViewModel) {
    val kebunList by viewModel.kebunList.collectAsState()
    var showDialog by remember { mutableStateOf(false) }
    var editingKebun by remember { mutableStateOf<KebunEntity?>(null) }
    val kebunToDelete = remember { mutableStateOf<KebunEntity?>(null) }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = {
                    editingKebun = null
                    showDialog = true
                },
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = Color.White
            ) {
                Icon(Icons.Filled.Add, contentDescription = "Tambah Kebun")
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
                title = "Manajemen Kebun",
                subtitle = "Kelola area, pohon & rotasi panen kebun sawit"
            )

            if (kebunList.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(bottom = 64.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Surface(
                            shape = CircleShape,
                            color = MaterialTheme.colorScheme.primaryContainer,
                            modifier = Modifier.size(72.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    imageVector = Icons.Default.Nature,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.size(36.dp)
                                )
                            }
                        }
                        Text(
                            text = "Belum Ada Data Kebun",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Tekan tombol + di bawah untuk mendaftarkan kebun sawit Anda.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.fillMaxSize()
                ) {
                    items(kebunList, key = { it.id }) { kebun ->
                        KebunCardModern(
                            kebun = kebun,
                            onEdit = {
                                editingKebun = kebun
                                showDialog = true
                            },
                            onDelete = { kebunToDelete.value = kebun }
                        )
                    }
                    item { Spacer(modifier = Modifier.height(80.dp)) }
                }
            }
        }
    }

    if (showDialog) {
        KebunFormDialog(
            initial = editingKebun,
            onDismiss = { showDialog = false },
            onSave = { kebun, isEdit ->
                viewModel.saveKebun(kebun, isEdit)
                showDialog = false
            }
        )
    }

    kebunToDelete.value?.let { kebun ->
        AlertDialog(
            onDismissRequest = { kebunToDelete.value = null },
            title = { Text("Hapus Kebun") },
            text = { Text("Yakin ingin menghapus kebun \"${kebun.nama}\"? Semua data terkait mungkin tidak lagi terhubung ke kebun ini.") },
            confirmButton = {
                TextButton(onClick = {
                    viewModel.deleteKebun(kebun)
                    kebunToDelete.value = null
                }) { Text("Hapus", color = MaterialTheme.colorScheme.error) }
            },
            dismissButton = {
                TextButton(onClick = { kebunToDelete.value = null }) { Text("Batal") }
            }
        )
    }
}

@Composable
fun KebunCardModern(
    kebun: KebunEntity,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    val now = System.currentTimeMillis()
    val hasLastHarvest = kebun.tanggalPanenTerakhir > 0
    val nextHarvestDate = if (hasLastHarvest) {
        kebun.tanggalPanenTerakhir + (kebun.rotasiPanenHari.toLong() * 24 * 60 * 60 * 1000)
    } else 0L
    val daysDiff = if (nextHarvestDate > 0) ((nextHarvestDate - now) / (24 * 60 * 60 * 1000)).toInt() else null

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Title & Actions
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
                        color = MaterialTheme.colorScheme.primaryContainer,
                        modifier = Modifier.size(38.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = Icons.Default.Nature,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }
                    Column {
                        Text(
                            text = kebun.nama,
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )
                        if (kebun.keterangan.isNotBlank()) {
                            Text(
                                text = kebun.keterangan,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }

                Row {
                    IconButton(onClick = onEdit) {
                        Icon(Icons.Filled.Edit, contentDescription = "Edit", tint = MaterialTheme.colorScheme.primary)
                    }
                    IconButton(onClick = onDelete) {
                        Icon(Icons.Filled.Delete, contentDescription = "Hapus", tint = RedExpense)
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Specs Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Surface(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(10.dp),
                    color = MaterialTheme.colorScheme.surfaceVariant
                ) {
                    Row(
                        modifier = Modifier.padding(8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Icon(Icons.Default.SquareFoot, null, modifier = Modifier.size(16.dp), tint = MaterialTheme.colorScheme.primary)
                        Column {
                            Text("Luas Area", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text("${kebun.luasHa} ha", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                Surface(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(10.dp),
                    color = MaterialTheme.colorScheme.surfaceVariant
                ) {
                    Row(
                        modifier = Modifier.padding(8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Icon(Icons.Default.Park, null, modifier = Modifier.size(16.dp), tint = PrimaryEmerald)
                        Column {
                            Text("Populasi", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text("${kebun.jumlahPohon} pohon", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                Surface(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(10.dp),
                    color = MaterialTheme.colorScheme.surfaceVariant
                ) {
                    Row(
                        modifier = Modifier.padding(8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Icon(Icons.Default.Repeat, null, modifier = Modifier.size(16.dp), tint = AmberGold)
                        Column {
                            Text("Rotasi", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text("${kebun.rotasiPanenHari} hari", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // Next Harvest Estimate Badge
            if (hasLastHarvest && daysDiff != null) {
                Spacer(modifier = Modifier.height(10.dp))
                val statusColor = when {
                    daysDiff <= 0 -> RedExpense
                    daysDiff <= 3 -> AmberGold
                    else -> PrimaryEmerald
                }
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = statusColor.copy(alpha = 0.12f),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Icon(Icons.Default.CalendarToday, null, modifier = Modifier.size(14.dp), tint = statusColor)
                            Text(
                                text = "Estimasi Panen Berikutnya: ${Formatters.formatDate(nextHarvestDate)}",
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Medium
                            )
                        }
                        Text(
                            text = when {
                                daysDiff < 0 -> "Terlambat ${-daysDiff} hr"
                                daysDiff == 0 -> "Hari Ini!"
                                else -> "$daysDiff hr lagi"
                            },
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = statusColor
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun KebunFormDialog(
    initial: KebunEntity?,
    onDismiss: () -> Unit,
    onSave: (KebunEntity, Boolean) -> Unit
) {
    var nama by remember { mutableStateOf(initial?.nama ?: "") }
    var luasHa by remember { mutableStateOf(initial?.luasHa?.takeIf { it > 0 }?.toString() ?: "") }
    var jumlahPohon by remember { mutableStateOf(initial?.jumlahPohon?.takeIf { it > 0 }?.toString() ?: "") }
    var rotasiPanenHari by remember { mutableStateOf(initial?.rotasiPanenHari?.toString() ?: "14") }
    var keterangan by remember { mutableStateOf(initial?.keterangan ?: "") }
    var error by remember { mutableStateOf<String?>(null) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (initial == null) "Tambah Kebun Sawit" else "Edit Data Kebun", fontWeight = FontWeight.Bold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(
                    value = nama,
                    onValueChange = { nama = it },
                    label = { Text("Nama / Blok Kebun") },
                    placeholder = { Text("Contoh: Kebun Blok A") },
                    modifier = Modifier.fillMaxWidth()
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = luasHa,
                        onValueChange = { luasHa = it },
                        label = { Text("Luas (ha)") },
                        keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = jumlahPohon,
                        onValueChange = { jumlahPohon = it },
                        label = { Text("Pohon") },
                        keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                }
                OutlinedTextField(
                    value = rotasiPanenHari,
                    onValueChange = { rotasiPanenHari = it },
                    label = { Text("Rotasi Panen (Hari)") },
                    placeholder = { Text("Standar: 14 hari") },
                    keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = keterangan,
                    onValueChange = { keterangan = it },
                    label = { Text("Keterangan / Lokasi (opsional)") },
                    modifier = Modifier.fillMaxWidth()
                )
                error?.let {
                    Text(text = it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                }
            }
        },
        confirmButton = {
            Button(onClick = {
                val luas = luasHa.toDoubleOrNull()
                val pohon = jumlahPohon.toIntOrNull()
                val rotasi = rotasiPanenHari.toIntOrNull() ?: 14
                when {
                    nama.isBlank() -> error = "Nama kebun wajib diisi"
                    luas == null || luas <= 0 -> error = "Luas harus berupa angka lebih dari 0"
                    pohon == null || pohon <= 0 -> error = "Jumlah pohon wajib diisi"
                    rotasi <= 0 -> error = "Rotasi panen minimal 1 hari"
                    else -> {
                        onSave(
                            (initial ?: KebunEntity()).copy(
                                nama = nama.trim(),
                                luasHa = luas,
                                jumlahPohon = pohon,
                                rotasiPanenHari = rotasi,
                                keterangan = keterangan.trim()
                            ),
                            initial != null
                        )
                    }
                }
            }) { Text(if (initial == null) "Simpan Kebun" else "Simpan Perubahan") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Batal") }
        }
    )
}
