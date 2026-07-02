"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardInsights = getDashboardInsights;
exports.getStallInsights = getStallInsights;
exports.getProductInsights = getProductInsights;
exports.getVendorInsights = getVendorInsights;
exports.getStudentInsights = getStudentInsights;
exports.getOrderInsights = getOrderInsights;
exports.getBudgetInsights = getBudgetInsights;
exports.getTrendInsights = getTrendInsights;

const models_1 = require("../models");

// ── COMPREHENSIVE DASHBOARD INSIGHTS ──────────────────────────────────────
async function getDashboardInsights() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all data in parallel
    const [
        students,
        stalls,
        orders,
        budgets,
        vendors
    ] = await Promise.all([
        models_1.StudentModel.find({}).lean(),
        models_1.StallModel.find({}).lean(),
        models_1.OrderModel.find({}).lean(),
        models_1.BudgetModel.find({}).lean(),
        models_1.StallModel.find({}, "vendors").lean()
    ]);

    // ── Student Insights ──────────────────────────────────────────────────
    const totalStudents = students.length;
    const verifiedStudents = students.filter(s => s.status === "verified").length;
    const unverifiedStudents = students.filter(s => s.status === "unverified").length;
    const deactivatedStudents = students.filter(s => s.status === "deactivated").length;

    const studentsByCourse = {};
    for (const student of students) {
        if (student.course) {
            studentsByCourse[student.course] = (studentsByCourse[student.course] || 0) + 1;
        }
    }

    // ── Stall Insights ──────────────────────────────────────────────────
    const totalStalls = stalls.length;
    const activeStalls = stalls.filter(s => s.status === true).length;
    const closedStalls = stalls.filter(s => s.status === false).length;
    const stallsWithContract = stalls.filter(s => s.proofOfContract).length;

    const stallsBySection = {};
    for (const stall of stalls) {
        if (stall.section) {
            stallsBySection[stall.section] = (stallsBySection[stall.section] || 0) + 1;
        }
    }

    // ── Product Insights ──────────────────────────────────────────────────
    let totalProducts = 0;
    let availableProducts = 0;
    const productsByCategory = {};
    const topProducts = [];

    for (const stall of stalls) {
        for (const product of stall.products || []) {
            totalProducts++;
            if (product.available) availableProducts++;
            
            const category = product.category || "Uncategorized";
            productsByCategory[category] = (productsByCategory[category] || 0) + 1;
            
            topProducts.push({
                productId: product._id,
                productName: product.productName,
                stallName: stall.stallName,
                price: product.price,
                favorite: product.favorite || 0,
                category: product.category
            });
        }
    }

    // Sort top products by favorites
    topProducts.sort((a, b) => b.favorite - a.favorite);

    // ── Vendor Insights ──────────────────────────────────────────────────
    let totalVendors = 0;
    const vendorsByStatus = {};
    const vendorsByPosition = {};

    for (const stall of stalls) {
        for (const vendor of stall.vendors || []) {
            totalVendors++;
            
            const status = vendor.status || "unverified";
            vendorsByStatus[status] = (vendorsByStatus[status] || 0) + 1;
            
            const position = vendor.position || "Unassigned";
            vendorsByPosition[position] = (vendorsByPosition[position] || 0) + 1;
        }
    }

    // ── Order Insights ──────────────────────────────────────────────────
    const totalOrders = orders.length;
    const ordersByStatus = {};
    const ordersByPaymentMethod = {};
    let totalRevenue = 0;
    let todayRevenue = 0;
    let weekRevenue = 0;
    let monthRevenue = 0;

    for (const order of orders) {
        const status = order.orderStatus || "pending";
        ordersByStatus[status] = (ordersByStatus[status] || 0) + 1;
        
        const method = order.paymentMethod || "unknown";
        ordersByPaymentMethod[method] = (ordersByPaymentMethod[method] || 0) + 1;
        
        totalRevenue += order.totalAmount || 0;
        
        if (order.createdAt >= today) todayRevenue += order.totalAmount || 0;
        if (order.createdAt >= weekAgo) weekRevenue += order.totalAmount || 0;
        if (order.createdAt >= monthAgo) monthRevenue += order.totalAmount || 0;
    }

    // ── Budget Insights ──────────────────────────────────────────────────
    const totalBudgets = budgets.length;
    const budgetsByStatus = {};
    let totalBudgetAmount = 0;
    let activeBudgetAmount = 0;

    for (const budget of budgets) {
        const status = budget.status || "active";
        budgetsByStatus[status] = (budgetsByStatus[status] || 0) + 1;
        totalBudgetAmount += budget.amount || 0;
        if (status === "active") activeBudgetAmount += budget.amount || 0;
    }

    // ── Return Comprehensive Insights ──────────────────────────────────
    return {
        summary: {
            totalStudents,
            totalStalls,
            totalVendors,
            totalProducts,
            totalOrders,
            totalRevenue,
            totalBudgets,
            totalBudgetAmount
        },
        students: {
            verified: verifiedStudents,
            unverified: unverifiedStudents,
            deactivated: deactivatedStudents,
            byCourse: studentsByCourse
        },
        stalls: {
            active: activeStalls,
            closed: closedStalls,
            withContract: stallsWithContract,
            bySection: stallsBySection
        },
        products: {
            total: totalProducts,
            available: availableProducts,
            byCategory: productsByCategory,
            topProducts: topProducts.slice(0, 10)
        },
        vendors: {
            total: totalVendors,
            byStatus: vendorsByStatus,
            byPosition: vendorsByPosition
        },
        orders: {
            total: totalOrders,
            byStatus: ordersByStatus,
            byPaymentMethod: ordersByPaymentMethod,
            revenue: {
                today: todayRevenue,
                week: weekRevenue,
                month: monthRevenue,
                total: totalRevenue
            }
        },
        budgets: {
            total: totalBudgets,
            byStatus: budgetsByStatus,
            totalAmount: totalBudgetAmount,
            activeAmount: activeBudgetAmount
        },
        timestamp: new Date()
    };
}

// ── STALL INSIGHTS ──────────────────────────────────────────────────────────
async function getStallInsights(stallId) {
    const stall = await models_1.StallModel.findById(stallId);
    if (!stall) return null;

    const orders = await models_1.OrderModel.find({ stallId }).lean();
    
    let totalRevenue = 0;
    const ordersByStatus = {};
    const ordersByPaymentMethod = {};
    const productSales = {};

    for (const order of orders) {
        totalRevenue += order.totalAmount || 0;
        
        const status = order.orderStatus || "pending";
        ordersByStatus[status] = (ordersByStatus[status] || 0) + 1;
        
        const method = order.paymentMethod || "unknown";
        ordersByPaymentMethod[method] = (ordersByPaymentMethod[method] || 0) + 1;
        
        for (const line of order.orderLines || []) {
            const key = line.productId.toString();
            if (!productSales[key]) {
                productSales[key] = {
                    productId: line.productId,
                    productName: line.productName,
                    quantity: 0,
                    revenue: 0
                };
            }
            productSales[key].quantity += line.quantity || 0;
            productSales[key].revenue += line.subtotal || 0;
        }
    }

    return {
        stall: {
            id: stall._id,
            name: stall.stallName,
            section: stall.section,
            status: stall.status,
            isInOperation: !!stall.proofOfContract
        },
        orders: {
            total: orders.length,
            byStatus: ordersByStatus,
            byPaymentMethod: ordersByPaymentMethod,
            totalRevenue
        },
        productSales: Object.values(productSales).sort((a, b) => b.quantity - a.quantity),
        vendorCount: stall.vendors?.length || 0,
        productCount: stall.products?.length || 0
    };
}

// ── PRODUCT INSIGHTS ──────────────────────────────────────────────────────
async function getProductInsights() {
    const stalls = await models_1.StallModel.find({}).lean();
    const insights = [];

    for (const stall of stalls) {
        for (const product of stall.products || []) {
            const reviews = product.reviews || [];
            const totalRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
            const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

            // Count how many times this product was ordered
            const orderCount = await models_1.OrderModel.countDocuments({
                "orderLines.productId": product._id
            });

            insights.push({
                productId: product._id,
                productName: product.productName,
                stallName: stall.stallName,
                category: product.category,
                price: product.price,
                stocks: product.stocks,
                available: product.available,
                favorite: product.favorite || 0,
                orderCount,
                reviewCount: reviews.length,
                averageRating,
                totalRating,
                nutrition: product.nutrition || {}
            });
        }
    }

    // Sort by favorites and orders
    insights.sort((a, b) => b.favorite - a.favorite);
    
    return {
        topByFavorites: insights.slice(0, 10),
        topByOrders: [...insights].sort((a, b) => b.orderCount - a.orderCount).slice(0, 10),
        topRated: [...insights].sort((a, b) => b.averageRating - a.averageRating).slice(0, 10),
        lowStock: insights.filter(p => p.stocks < 10 && p.available),
        allProducts: insights
    };
}

// ── VENDOR INSIGHTS ──────────────────────────────────────────────────────
async function getVendorInsights() {
    const stalls = await models_1.StallModel.find({}, "vendors stallName").lean();
    const vendorData = [];

    for (const stall of stalls) {
        for (const vendor of stall.vendors || []) {
            const orders = await models_1.OrderModel.find({ stallId: stall._id }).lean();
            const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
            const totalOrders = orders.length;

            vendorData.push({
                email: vendor.email,
                firstName: vendor.firstName,
                lastName: vendor.lastName,
                position: vendor.position,
                status: vendor.status,
                stallName: stall.stallName,
                stallId: stall._id,
                totalOrders,
                totalRevenue,
                phoneNumber: vendor.phoneNumber
            });
        }
    }

    return {
        vendors: vendorData,
        summary: {
            totalVendors: vendorData.length,
            byStatus: vendorData.reduce((acc, v) => {
                acc[v.status] = (acc[v.status] || 0) + 1;
                return acc;
            }, {}),
            byPosition: vendorData.reduce((acc, v) => {
                acc[v.position] = (acc[v.position] || 0) + 1;
                return acc;
            }, {})
        }
    };
}

// ── STUDENT INSIGHTS ──────────────────────────────────────────────────────
async function getStudentInsights() {
    const students = await models_1.StudentModel.find({}).lean();
    const orders = await models_1.OrderModel.find({}).lean();

    const studentOrderCount = {};
    const studentSpending = {};

    for (const order of orders) {
        const id = order.studentId.toString();
        studentOrderCount[id] = (studentOrderCount[id] || 0) + 1;
        studentSpending[id] = (studentSpending[id] || 0) + (order.totalAmount || 0);
    }

    const insights = students.map(student => ({
        ...student,
        orderCount: studentOrderCount[student._id.toString()] || 0,
        totalSpent: studentSpending[student._id.toString()] || 0
    }));

    return {
        students: insights,
        summary: {
            totalStudents: students.length,
            verified: students.filter(s => s.status === "verified").length,
            unverified: students.filter(s => s.status === "unverified").length,
            deactivated: students.filter(s => s.status === "deactivated").length,
            totalOrders: orders.length,
            totalSpent: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
            averageSpentPerStudent: students.length > 0 ? 
                orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) / students.length : 0
        }
    };
}

// ── ORDER INSIGHTS ──────────────────────────────────────────────────────
async function getOrderInsights() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const orders = await models_1.OrderModel.find({})
        .populate("studentId", "course")
        .populate("stallId", "stallName")
        .lean();

    const revenueByDay = {};
    const revenueByWeek = {};
    const revenueByMonth = {};
    const ordersByCourse = {};
    const ordersByStall = {};

    for (const order of orders) {
        const date = order.createdAt;
        const dayKey = date.toISOString().split('T')[0];
        const weekKey = `${date.getFullYear()}-W${Math.ceil((date - new Date(date.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000))}`;
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        revenueByDay[dayKey] = (revenueByDay[dayKey] || 0) + (order.totalAmount || 0);
        revenueByWeek[weekKey] = (revenueByWeek[weekKey] || 0) + (order.totalAmount || 0);
        revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + (order.totalAmount || 0);

        const course = order.studentId?.course || "Unknown";
        ordersByCourse[course] = (ordersByCourse[course] || 0) + 1;

        const stallName = order.stallId?.stallName || "Unknown";
        ordersByStall[stallName] = (ordersByStall[stallName] || 0) + 1;
    }

    return {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
        revenueByDay,
        revenueByWeek,
        revenueByMonth,
        ordersByCourse,
        ordersByStall,
        todayRevenue: orders.filter(o => o.createdAt >= today)
            .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
        weekRevenue: orders.filter(o => o.createdAt >= weekAgo)
            .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
        monthRevenue: orders.filter(o => o.createdAt >= monthAgo)
            .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
        recentOrders: orders.slice(0, 10)
    };
}

// ── BUDGET INSIGHTS ──────────────────────────────────────────────────────
async function getBudgetInsights() {
    const budgets = await models_1.BudgetModel.find({})
        .populate("studentId", "firstName lastName course")
        .lean();

    const now = new Date();
    const activeBudgets = budgets.filter(b => b.status === "active" && b.duration.endDate >= now);
    const expiredBudgets = budgets.filter(b => b.status === "active" && b.duration.endDate < now);
    const accomplishedBudgets = budgets.filter(b => b.status === "accomplished");
    const failedBudgets = budgets.filter(b => b.status === "failed");

    const byCourse = {};
    for (const budget of budgets) {
        const course = budget.studentCourse || "Unknown";
        if (!byCourse[course]) {
            byCourse[course] = { count: 0, totalAmount: 0 };
        }
        byCourse[course].count++;
        byCourse[course].totalAmount += budget.amount || 0;
    }

    return {
        totalBudgets: budgets.length,
        activeBudgets: activeBudgets.length,
        expiredBudgets: expiredBudgets.length,
        accomplishedBudgets: accomplishedBudgets.length,
        failedBudgets: failedBudgets.length,
        totalAmount: budgets.reduce((sum, b) => sum + (b.amount || 0), 0),
        byCourse,
        recentBudgets: budgets.slice(0, 10)
    };
}

// ── TREND INSIGHTS ──────────────────────────────────────────────────────
async function getTrendInsights() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stalls = await models_1.StallModel.find({}).lean();
    
    // Favorite trends
    const favoriteTrends = {
        today: {},
        week: {},
        month: {},
        allTime: {}
    };

    // Get all students and their favorites
    const students = await models_1.StudentModel.find({}, "favorites course").lean();

    for (const student of students) {
        for (const fav of student.favorites || []) {
            const date = new Date(fav.date);
            
            // Track by period
            const periods = {
                today: date >= today,
                week: date >= weekAgo,
                month: date >= monthAgo,
                allTime: true
            };

            for (const [period, include] of Object.entries(periods)) {
                if (!include) continue;
                
                const key = fav.productId.toString();
                if (!favoriteTrends[period][key]) {
                    favoriteTrends[period][key] = {
                        productId: fav.productId,
                        productName: fav.productName,
                        stallName: fav.stallName,
                        count: 0
                    };
                }
                favoriteTrends[period][key].count++;
            }
        }
    }

    // Convert to arrays and sort
    const result = {};
    for (const period of ["today", "week", "month", "allTime"]) {
        const items = Object.values(favoriteTrends[period]);
        // Enrich with product details
        const enriched = [];
        for (const item of items) {
            // Find product details
            for (const stall of stalls) {
                const product = stall.products?.find(p => p._id.toString() === item.productId.toString());
                if (product) {
                    enriched.push({
                        ...item,
                        category: product.category,
                        price: product.price,
                        nutrition: product.nutrition || {}
                    });
                    break;
                }
            }
        }
        result[period] = enriched.sort((a, b) => b.count - a.count).slice(0, 10);
    }

    return {
        favoriteTrends: result,
        topStalls: stalls
            .map(s => ({
                stallName: s.stallName,
                section: s.section,
                productCount: s.products?.length || 0,
                vendorCount: s.vendors?.length || 0,
                isActive: s.status
            }))
            .sort((a, b) => b.productCount - a.productCount)
            .slice(0, 10)
    };
}