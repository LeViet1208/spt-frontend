"use server"

// import { executeQuery } from "./db"
// import mysql from "mysql2/promise"

// Mock data for testing
const mockData = {
  sales: [],
  inventory: [],
  customers: [],
  imports: [
    { id: 1, import_type: "sales", record_count: 120, created_at: new Date(), status: "completed" },
    { id: 2, import_type: "inventory", record_count: 85, created_at: new Date(), status: "completed" },
    { id: 3, import_type: "customers", record_count: 50, created_at: new Date(), status: "completed" },
  ],
  dashboardData: {
    sales: {
      total_revenue: 125000,
      total_orders: 450,
      average_order_value: 277.78,
    },
    inventory: {
      total_products: 85,
      low_stock_items: 12,
      out_of_stock: 3,
      inventory_value: 45000,
    },
    customers: {
      total_customers: 200,
    },
  },
}

/*
async function getConnection() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable not set.")
  }

  return await mysql.createConnection(process.env.DATABASE_URL)
}
*/

// Sales data functions
export async function saveSalesData(userId: number, salesData: any[]) {
  try {
    // Comment out database operations
    /*
    // Begin transaction
    const connection = await getConnection()
    await connection.beginTransaction()

    try {
      // Insert import record
      const [importResult]: any = await connection.execute(
        "INSERT INTO data_imports (user_id, import_type, record_count, created_at) VALUES (?, ?, ?, NOW())",
        [userId, "sales", salesData.length],
      )

      const importId = importResult.insertId

      // Insert sales data
      for (const sale of salesData) {
        await connection.execute(
          `INSERT INTO sales (
            import_id, user_id, order_id, date, product_id, 
            quantity, price, customer_id, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [importId, userId, sale.orderId, sale.date, sale.productId, sale.quantity, sale.price, sale.customerId],
        )
      }

      // Commit transaction
      await connection.commit()
      await connection.end()

      return { success: true, importId }
    } catch (error) {
      // Rollback on error
      await connection.rollback()
      await connection.end()
      throw error
    }
    */

    // Mock implementation
    const importId = mockData.imports.length + 1
    mockData.imports.push({
      id: importId,
      import_type: "sales",
      record_count: salesData.length,
      created_at: new Date(),
      status: "completed",
    })

    mockData.sales = [...mockData.sales, ...salesData]

    return { success: true, importId }
  } catch (error) {
    console.error("Error saving sales data:", error)
    throw new Error("Failed to save sales data")
  }
}

// Inventory data functions
export async function saveInventoryData(userId: number, inventoryData: any[]) {
  try {
    // Comment out database operations
    /*
    // Begin transaction
    const connection = await getConnection()
    await connection.beginTransaction()

    try {
      // Insert import record
      const [importResult]: any = await connection.execute(
        "INSERT INTO data_imports (user_id, import_type, record_count, created_at) VALUES (?, ?, ?, NOW())",
        [userId, "inventory", inventoryData.length],
      )

      const importId = importResult.insertId

      // Insert inventory data
      for (const item of inventoryData) {
        await connection.execute(
          `INSERT INTO inventory (
            import_id, user_id, product_id, product_name, 
            category, quantity, price, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          [importId, userId, item.productId, item.productName, item.category, item.quantity, item.price],
        )
      }

      // Commit transaction
      await connection.commit()
      await connection.end()

      return { success: true, importId }
    } catch (error) {
      // Rollback on error
      await connection.rollback()
      await connection.end()
      throw error
    }
    */

    // Mock implementation
    const importId = mockData.imports.length + 1
    mockData.imports.push({
      id: importId,
      import_type: "inventory",
      record_count: inventoryData.length,
      created_at: new Date(),
      status: "completed",
    })

    mockData.inventory = [...mockData.inventory, ...inventoryData]

    return { success: true, importId }
  } catch (error) {
    console.error("Error saving inventory data:", error)
    throw new Error("Failed to save inventory data")
  }
}

// Customer data functions
export async function saveCustomerData(userId: number, customerData: any[]) {
  try {
    // Comment out database operations
    /*
    // Begin transaction
    const connection = await getConnection()
    await connection.beginTransaction()

    try {
      // Insert import record
      const [importResult]: any = await connection.execute(
        "INSERT INTO data_imports (user_id, import_type, record_count, created_at) VALUES (?, ?, ?, NOW())",
        [userId, "customers", customerData.length],
      )

      const importId = importResult.insertId

      // Insert customer data
      for (const customer of customerData) {
        await connection.execute(
          `INSERT INTO customers (
            import_id, user_id, customer_id, name, 
            email, phone, address, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          [importId, userId, customer.customerId, customer.name, customer.email, customer.phone, customer.address],
        )
      }

      // Commit transaction
      await connection.commit()
      await connection.end()

      return { success: true, importId }
    } catch (error) {
      // Rollback on error
      await connection.rollback()
      await connection.end()
      throw error
    }
    */

    // Mock implementation
    const importId = mockData.imports.length + 1
    mockData.imports.push({
      id: importId,
      import_type: "customers",
      record_count: customerData.length,
      created_at: new Date(),
      status: "completed",
    })

    mockData.customers = [...mockData.customers, ...customerData]

    return { success: true, importId }
  } catch (error) {
    console.error("Error saving customer data:", error)
    throw new Error("Failed to save customer data")
  }
}

// Get import history
export async function getImportHistory(userId: number) {
  try {
    // Comment out database operations
    /*
    const imports = await executeQuery(
      `SELECT 
        id, import_type, record_count, created_at, status
      FROM data_imports 
      WHERE user_id = ? 
      ORDER BY created_at DESC`,
      [userId],
    )
    */

    // Mock implementation
    return mockData.imports
  } catch (error) {
    console.error("Error getting import history:", error)
    throw new Error("Failed to get import history")
  }
}

// Get dashboard data
export async function getDashboardData(userId: number) {
  try {
    // Comment out database operations
    /*
    // Get sales summary
    const salesSummary = await executeQuery(
      `SELECT 
        SUM(price * quantity) as total_revenue,
        COUNT(DISTINCT order_id) as total_orders,
        AVG(price * quantity) as average_order_value
      FROM sales 
      WHERE user_id = ?`,
      [userId],
    )

    // Get inventory summary
    const inventorySummary = await executeQuery(
      `SELECT 
        COUNT(*) as total_products,
        SUM(CASE WHEN quantity < 10 THEN 1 ELSE 0 END) as low_stock_items,
        SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) as out_of_stock,
        SUM(quantity * price) as inventory_value
      FROM inventory 
      WHERE user_id = ?`,
      [userId],
    )

    // Get customer summary
    const customerSummary = await executeQuery(
      `SELECT 
        COUNT(*) as total_customers
      FROM customers 
      WHERE user_id = ?`,
      [userId],
    )

    return {
      sales: Array.isArray(salesSummary) && salesSummary.length > 0 ? salesSummary[0] : null,
      inventory: Array.isArray(inventorySummary) && inventorySummary.length > 0 ? inventorySummary[0] : null,
      customers: Array.isArray(customerSummary) && customerSummary.length > 0 ? customerSummary[0] : null,
    }
    */

    // Mock implementation
    return mockData.dashboardData
  } catch (error) {
    console.error("Error getting dashboard data:", error)
    throw new Error("Failed to get dashboard data")
  }
}
