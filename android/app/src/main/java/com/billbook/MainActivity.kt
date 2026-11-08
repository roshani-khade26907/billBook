package com.billbook

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.navigation.compose.*
import com.billbook.data.database.BillBookDatabase

val PrimaryColor = Color(0xFF9E1B46) // Deep Magenta / Raspberry
val SecondaryColor = Color(0xFFFCE7F0) // Soft Pink
val BackgroundColor = Color(0xFFF8F6F4) // Warm off-white
val SurfaceColor = Color(0xFFFFFFFF)
val TextColor = Color(0xFF1E1E24)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val database = BillBookDatabase.getDatabase(this)

        setContent {
            BillBookApp(database = database)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BillBookApp(database: BillBookDatabase) {
    val navController = rememberNavController()
    var selectedItem by remember { mutableIntStateOf(0) }

    val navItems = listOf(
        Triple("Home", Icons.Default.Dashboard, "dashboard"),
        Triple("New Bill", Icons.Default.AddShoppingCart, "new_bill"),
        Triple("Products", Icons.Default.Inventory2, "products"),
        Triple("History", Icons.Default.ReceiptLong, "history"),
        Triple("Settings", Icons.Default.Storefront, "settings")
    )

    MaterialTheme(
        colorScheme = lightColorScheme(
            primary = PrimaryColor,
            secondary = SecondaryColor,
            background = BackgroundColor,
            surface = SurfaceColor,
            onPrimary = Color.White,
            onSurface = TextColor
        )
    ) {
        Scaffold(
            bottomBar = {
                NavigationBar(
                    containerColor = SurfaceColor,
                    tonalElevation = 8.dp
                ) {
                    navItems.forEachIndexed { index, (label, icon, route) ->
                        NavigationBarItem(
                            icon = { Icon(icon, contentDescription = label) },
                            label = { Text(label) },
                            selected = selectedItem == index,
                            onClick = {
                                selectedItem = index
                                navController.navigate(route) {
                                    popUpTo(navController.graph.startDestinationId) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = PrimaryColor,
                                selectedTextColor = PrimaryColor,
                                indicatorColor = SecondaryColor
                            )
                        )
                    }
                }
            }
        ) { paddingValues ->
            NavHost(
                navController = navController,
                startDestination = "dashboard",
                modifier = Modifier.padding(paddingValues)
            ) {
                composable("dashboard") {
                    // Dashboard View composable
                    Box(modifier = Modifier.fillMaxSize()) {
                        Text("Bill Book Dashboard - Offline Shop Manager", modifier = Modifier.padding(16.dp))
                    }
                }
                composable("new_bill") {
                    // New Bill Creation View
                    Box(modifier = Modifier.fillMaxSize()) {
                        Text("New Bill Creation & Instant UPI QR", modifier = Modifier.padding(16.dp))
                    }
                }
                composable("products") {
                    // Product Catalogue View
                    Box(modifier = Modifier.fillMaxSize()) {
                        Text("Product & Inventory Management", modifier = Modifier.padding(16.dp))
                    }
                }
                composable("history") {
                    // Saved Bills History View
                    Box(modifier = Modifier.fillMaxSize()) {
                        Text("Bill History & Daily Transactions", modifier = Modifier.padding(16.dp))
                    }
                }
                composable("settings") {
                    // Shop Profile & UPI Setup
                    Box(modifier = Modifier.fillMaxSize()) {
                        Text("Shop Profile & Settings", modifier = Modifier.padding(16.dp))
                    }
                }
            }
        }
    }
}
