package com.sawitku.app.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.sawitku.app.util.Formatters.formatRupiah

data class ChartBarData(
    val label: String,
    val value: Double,
    val secondaryValue: Double = 0.0,
    val formattedValue: String = ""
)

data class DonutSliceData(
    val label: String,
    val value: Double,
    val color: Color
)

@Composable
fun SawitBarChart(
    data: List<ChartBarData>,
    modifier: Modifier = Modifier,
    barColor: Color = MaterialTheme.colorScheme.primary,
    gradientColors: List<Color> = listOf(
        MaterialTheme.colorScheme.primary,
        MaterialTheme.colorScheme.primary.copy(alpha = 0.6f)
    ),
    height: Dp = 200.dp
) {
    if (data.isEmpty()) {
        Box(
            modifier = modifier
                .fillMaxWidth()
                .height(height),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "Tidak ada data untuk grafik",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        return
    }

    val maxVal = data.maxOfOrNull { it.value }?.takeIf { it > 0 } ?: 1.0
    val labelColor = MaterialTheme.colorScheme.onSurfaceVariant
    val gridColor = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.4f)

    Column(modifier = modifier.fillMaxWidth()) {
        Canvas(
            modifier = Modifier
                .fillMaxWidth()
                .height(height)
                .padding(top = 16.dp, bottom = 4.dp, start = 8.dp, end = 8.dp)
        ) {
            val chartBottom = size.height - 40f
            val chartTop = 10f
            val availableHeight = chartBottom - chartTop
            val count = data.size
            val slotWidth = size.width / count
            val barWidth = (slotWidth * 0.55f).coerceAtMost(48f)

            // Draw 3 horizontal grid lines
            for (i in 0..3) {
                val y = chartTop + (availableHeight / 3f) * i
                drawLine(
                    color = gridColor,
                    start = Offset(0f, y),
                    end = Offset(size.width, y),
                    strokeWidth = 1f
                )
            }

            // Draw bars and labels
            data.forEachIndexed { index, item ->
                val centerX = index * slotWidth + slotWidth / 2f
                val barHeight = if (maxVal > 0) ((item.value / maxVal) * availableHeight).toFloat() else 0f
                val barTop = chartBottom - barHeight
                val left = centerX - barWidth / 2f

                // Bar brush
                val brush = Brush.verticalGradient(
                    colors = gradientColors,
                    startY = barTop,
                    endY = chartBottom
                )

                // Background subtle track
                drawRoundRect(
                    color = gridColor.copy(alpha = 0.15f),
                    topLeft = Offset(left, chartTop),
                    size = Size(barWidth, availableHeight),
                    cornerRadius = CornerRadius(8f, 8f)
                )

                // Actual value bar
                if (barHeight > 0) {
                    drawRoundRect(
                        brush = brush,
                        topLeft = Offset(left, barTop),
                        size = Size(barWidth, barHeight),
                        cornerRadius = CornerRadius(8f, 8f)
                    )
                }

                // Native text for X-axis label
                drawContext.canvas.nativeCanvas.apply {
                    val paint = android.graphics.Paint().apply {
                        color = labelColor.toArgb()
                        textSize = 26f
                        textAlign = android.graphics.Paint.Align.CENTER
                        isAntiAlias = true
                    }
                    drawText(item.label, centerX, size.height - 8f, paint)
                }
            }
        }
    }
}

@Composable
fun SawitDonutChart(
    slices: List<DonutSliceData>,
    modifier: Modifier = Modifier,
    centerTitle: String = "Total Biaya",
    height: Dp = 220.dp
) {
    val total = slices.sumOf { it.value }.takeIf { it > 0 } ?: 1.0
    val formattedTotal = formatRupiah(slices.sumOf { it.value })

    Column(modifier = modifier.fillMaxWidth()) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(height),
            contentAlignment = Alignment.Center
        ) {
            Canvas(
                modifier = Modifier
                    .size(height - 20.dp)
                    .padding(12.dp)
            ) {
                var startAngle = -90f
                val strokeWidth = 32f

                if (slices.isEmpty() || slices.all { it.value <= 0 }) {
                    drawArc(
                        color = Color(0xFFD3D3D3).copy(alpha = 0.4f),
                        startAngle = 0f,
                        sweepAngle = 360f,
                        useCenter = false,
                        style = Stroke(width = strokeWidth)
                    )
                } else {
                    slices.forEach { slice ->
                        val sweep = ((slice.value / total) * 360f).toFloat()
                        if (sweep > 0) {
                            drawArc(
                                color = slice.color,
                                startAngle = startAngle,
                                sweepAngle = (sweep - 2f).coerceAtLeast(1f), // subtle gap
                                useCenter = false,
                                style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
                            )
                            startAngle += sweep
                        }
                    }
                }
            }

            // Center Text inside Donut
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    text = centerTitle,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = formattedTotal,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Legend
        Column(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            slices.forEach { slice ->
                val percentage = if (total > 0) (slice.value / total * 100).toInt() else 0
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(12.dp)
                                .background(slice.color, CircleShape)
                        )
                        Text(
                            text = slice.label,
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Medium
                        )
                    }
                    Text(
                        text = "${formatRupiah(slice.value)} ($percentage%)",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}
