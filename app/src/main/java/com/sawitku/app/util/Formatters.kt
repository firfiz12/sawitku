package com.sawitku.app.util

import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

object Formatters {
    private val dateFormat = SimpleDateFormat("dd MMM yyyy", Locale("id", "ID"))
    private val shortDateFormat = SimpleDateFormat("dd MMM", Locale("id", "ID"))
    private val monthYearFormat = SimpleDateFormat("MMMM yyyy", Locale("id", "ID"))
    private val idrFormat: NumberFormat = NumberFormat.getNumberInstance(Locale("id", "ID")).apply {
        minimumFractionDigits = 0
        maximumFractionDigits = 0
    }

    private val tonFormat: NumberFormat = NumberFormat.getNumberInstance(Locale("id", "ID")).apply {
        minimumFractionDigits = 0
        maximumFractionDigits = 2
    }

    fun formatDate(timestamp: Long): String {
        if (timestamp <= 0L) return "-"
        return dateFormat.format(Date(timestamp))
    }

    fun formatShortDate(timestamp: Long): String {
        if (timestamp <= 0L) return "-"
        return shortDateFormat.format(Date(timestamp))
    }

    fun formatMonthYear(timestamp: Long): String {
        if (timestamp <= 0L) return "-"
        return monthYearFormat.format(Date(timestamp))
    }

    fun formatRupiah(value: Double): String = "Rp ${idrFormat.format(value.toLong())}"

    fun formatNumber(value: Double): String = idrFormat.format(value)

    fun formatKg(value: Double): String = "${idrFormat.format(value.toLong())} kg"

    fun formatTon(value: Double): String = "${tonFormat.format(value / 1000.0)} Ton"

    fun formatKgAndTon(value: Double): String {
        val kg = idrFormat.format(value.toLong())
        val ton = tonFormat.format(value / 1000.0)
        return "$kg kg / $ton Ton"
    }

    fun startOfDay(calendar: Calendar = Calendar.getInstance()): Long {
        val c = (calendar.clone() as Calendar).apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        return c.timeInMillis
    }

    fun endOfDay(calendar: Calendar = Calendar.getInstance()): Long {
        val c = (calendar.clone() as Calendar).apply {
            set(Calendar.HOUR_OF_DAY, 23)
            set(Calendar.MINUTE, 59)
            set(Calendar.SECOND, 59)
            set(Calendar.MILLISECOND, 999)
        }
        return c.timeInMillis
    }

    fun isCurrentMonth(ts: Long): Boolean {
        val c = Calendar.getInstance().apply { timeInMillis = ts }
        val now = Calendar.getInstance()
        return c.get(Calendar.YEAR) == now.get(Calendar.YEAR) &&
                c.get(Calendar.MONTH) == now.get(Calendar.MONTH)
    }

    fun isCurrentYear(ts: Long): Boolean {
        val c = Calendar.getInstance().apply { timeInMillis = ts }
        val now = Calendar.getInstance()
        return c.get(Calendar.YEAR) == now.get(Calendar.YEAR)
    }

    fun isSameMonth(ts: Long, targetMonth: Int, targetYear: Int): Boolean {
        val c = Calendar.getInstance().apply { timeInMillis = ts }
        return c.get(Calendar.MONTH) == targetMonth && c.get(Calendar.YEAR) == targetYear
    }

    fun isSameYear(ts: Long, targetYear: Int): Boolean {
        val c = Calendar.getInstance().apply { timeInMillis = ts }
        return c.get(Calendar.YEAR) == targetYear
    }

    fun getYear(ts: Long): Int {
        val c = Calendar.getInstance().apply { timeInMillis = ts }
        return c.get(Calendar.YEAR)
    }

    fun getMonth(ts: Long): Int {
        val c = Calendar.getInstance().apply { timeInMillis = ts }
        return c.get(Calendar.MONTH)
    }

    val monthNames = arrayOf(
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    )

    val monthShortNames = arrayOf(
        "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
        "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
    )
}
