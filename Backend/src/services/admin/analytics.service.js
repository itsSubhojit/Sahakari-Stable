import { db } from "../../config/firebase.js";
import ApiError from "../../utils/ApiError.js";

/**
 * Fetch federation-wide or cooperative-scoped administration dashboard KPIs.
 *
 * @param {Object} user - { uid, role } from req.user
 * @returns {Promise<Object>} Aggregated KPI metrics payload
 */
export const getFederationOverviewService = async (user) => {
  const adminDoc = await db.collection("admins").doc(user.uid).get();
  const adminData = adminDoc.exists ? adminDoc.data() : {};
  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const cooperativeId = adminData.cooperativeId || null;

  const activeBookingStatuses = [
    "PENDING_PAYMENT",
    "CONFIRMED",
    "WORKER_ACCEPTED",
    "ON_THE_WAY",
    "ARRIVED",
    "IN_PROGRESS",
  ];

  // ── CASE 1: SUPER_ADMIN or Global Admin (Global Federation View) ───────────────
  if (isSuperAdmin || !cooperativeId) {
    const [
      cooperativesCountSnap,
      totalWorkersCountSnap,
      verifiedWorkersCountSnap,
      pendingWorkersCountSnap,
      totalCustomersCountSnap,
      activeBookingsCountSnap,
      openSosCountSnap,
      paymentsSnap,
    ] = await Promise.all([
      db.collection("cooperatives").count().get(),
      db.collection("workers").count().get(),
      db.collection("workers").where("verificationStatus", "==", "verified").count().get(),
      db.collection("workers").where("verificationStatus", "==", "pending").count().get(),
      db.collection("customers").count().get(),
      db.collection("bookings").where("status", "in", activeBookingStatuses).count().get(),
      db.collection("safetyAlerts").where("status", "==", "OPEN").count().get(),
      db.collection("payments").where("status", "==", "SUCCESS").get(),
    ]);

    let grossRevenue = 0;
    let successfulPaymentsCount = 0;
    paymentsSnap.forEach((doc) => {
      const data = doc.data();
      grossRevenue += typeof data.amount === "number" ? data.amount : 0;
      successfulPaymentsCount++;
    });

    const totalWorkers = totalWorkersCountSnap.data().count;
    const verifiedWorkers = verifiedWorkersCountSnap.data().count;

    return {
      kpis: {
        totalCooperatives: cooperativesCountSnap.data().count,
        totalWorkers,
        verifiedWorkers,
        verifiedRatio: totalWorkers > 0 ? Number((verifiedWorkers / totalWorkers).toFixed(2)) : 0,
        pendingVerifications: pendingWorkersCountSnap.data().count,
        totalCustomers: totalCustomersCountSnap.data().count,
        activeBookings: activeBookingsCountSnap.data().count,
        openSafetyAlerts: openSosCountSnap.data().count,
        grossRevenue: Number(grossRevenue.toFixed(2)),
        successfulPaymentsCount,
      },
      scope: "FEDERATION_GLOBAL",
      adminRole: user.role,
    };
  }

  // ── CASE 2: COOPERATIVE_ADMIN with an assigned cooperativeId ──────────────────
  const coopDoc = await db.collection("cooperatives").doc(cooperativeId).get();
  if (!coopDoc.exists) {
    throw new ApiError(404, `Assigned cooperative '${cooperativeId}' not found`);
  }
  const coopData = coopDoc.data();
  const memberWorkerIds = Array.isArray(coopData.memberWorkerIds) ? coopData.memberWorkerIds : [];

  if (memberWorkerIds.length === 0) {
    return {
      kpis: {
        cooperativeId,
        cooperativeName: coopData.name || "",
        cooperativeCode: coopData.code || "",
        totalWorkers: 0,
        verifiedWorkers: 0,
        verifiedRatio: 0,
        pendingVerifications: 0,
        activeBookings: 0,
        openSafetyAlerts: 0,
        grossRevenue: 0,
        successfulPaymentsCount: 0,
      },
      scope: `COOPERATIVE_${cooperativeId}`,
      adminRole: user.role,
    };
  }

  const workerChunks = [];
  for (let i = 0; i < memberWorkerIds.length; i += 30) {
    workerChunks.push(memberWorkerIds.slice(i, i + 30));
  }

  let scopedTotalWorkers = memberWorkerIds.length;
  let scopedVerifiedWorkers = 0;
  let scopedPendingVerifications = 0;
  let scopedActiveBookings = 0;
  let scopedOpenSos = 0;
  let scopedGrossRevenue = 0;
  let scopedSuccessfulPaymentsCount = 0;

  for (const chunk of workerChunks) {
    const [workersSnap, bookingsSnap, sosSnap, paymentsSnap] = await Promise.all([
      db.collection("workers").where("__name__", "in", chunk).get(),
      db.collection("bookings").where("workerId", "in", chunk).where("status", "in", activeBookingStatuses).get(),
      db.collection("safetyAlerts").where("workerId", "in", chunk).where("status", "==", "OPEN").get(),
      db.collection("payments").where("workerId", "in", chunk).where("status", "==", "SUCCESS").get(),
    ]);

    workersSnap.forEach((doc) => {
      const v = doc.data().verificationStatus;
      if (v === "verified") scopedVerifiedWorkers++;
      else if (v === "pending") scopedPendingVerifications++;
    });

    scopedActiveBookings += bookingsSnap.size;
    scopedOpenSos += sosSnap.size;

    paymentsSnap.forEach((doc) => {
      const data = doc.data();
      scopedGrossRevenue += typeof data.amount === "number" ? data.amount : 0;
      scopedSuccessfulPaymentsCount++;
    });
  }

  return {
    kpis: {
      cooperativeId,
      cooperativeName: coopData.name || "",
      cooperativeCode: coopData.code || "",
      totalWorkers: scopedTotalWorkers,
      verifiedWorkers: scopedVerifiedWorkers,
      verifiedRatio: scopedTotalWorkers > 0 ? Number((scopedVerifiedWorkers / scopedTotalWorkers).toFixed(2)) : 0,
      pendingVerifications: scopedPendingVerifications,
      activeBookings: scopedActiveBookings,
      openSafetyAlerts: scopedOpenSos,
      grossRevenue: Number(scopedGrossRevenue.toFixed(2)),
      successfulPaymentsCount: scopedSuccessfulPaymentsCount,
    },
    scope: `COOPERATIVE_${cooperativeId}`,
    adminRole: user.role,
  };
};

/**
 * GET /api/admin/analytics/overview
 * Financial & Transaction Analytics overview.
 * Calculates total bookings, booking status breakdown, total payments, successful payments,
 * failed payments, payment status breakdown, gross revenue, average payment value, and average booking value.
 *
 * @param {Object} user - { uid, role }
 * @returns {Promise<Object>} Financial analytics metrics payload
 */
export const getFinancialAnalyticsOverviewService = async (user) => {
  const adminDoc = await db.collection("admins").doc(user.uid).get();
  const adminData = adminDoc.exists ? adminDoc.data() : {};
  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const cooperativeId = adminData.cooperativeId || null;

  const ALL_BOOKING_STATUSES = [
    "PENDING_PAYMENT",
    "CONFIRMED",
    "WORKER_ACCEPTED",
    "ON_THE_WAY",
    "ARRIVED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
  ];

  // ── CASE 1: SUPER_ADMIN or Global Admin (Global Platform Financial View) ────
  if (isSuperAdmin || !cooperativeId) {
    const [bookingsSnap, paymentsSnap] = await Promise.all([
      db.collection("bookings").get(),
      db.collection("payments").get(),
    ]);

    const bookingStatusBreakdown = {};
    ALL_BOOKING_STATUSES.forEach((st) => (bookingStatusBreakdown[st] = 0));

    let totalBookings = 0;
    bookingsSnap.forEach((doc) => {
      totalBookings++;
      const st = doc.data().status;
      if (st && bookingStatusBreakdown[st] !== undefined) {
        bookingStatusBreakdown[st]++;
      } else if (st) {
        bookingStatusBreakdown[st] = (bookingStatusBreakdown[st] || 0) + 1;
      }
    });

    const paymentStatusBreakdown = { SUCCESS: 0, FAILED: 0 };
    let totalPayments = 0;
    let successfulPayments = 0;
    let failedPayments = 0;
    let grossRevenue = 0;

    paymentsSnap.forEach((doc) => {
      totalPayments++;
      const data = doc.data();
      const pStatus = (data.status || "UNKNOWN").toUpperCase();
      paymentStatusBreakdown[pStatus] = (paymentStatusBreakdown[pStatus] || 0) + 1;

      if (pStatus === "SUCCESS") {
        successfulPayments++;
        grossRevenue += typeof data.amount === "number" ? data.amount : 0;
      } else if (pStatus === "FAILED") {
        failedPayments++;
      }
    });

    const averagePaymentValue =
      successfulPayments > 0 ? Number((grossRevenue / successfulPayments).toFixed(2)) : 0;
    const averageBookingValue =
      totalBookings > 0 ? Number((grossRevenue / totalBookings).toFixed(2)) : 0;

    return {
      analytics: {
        totalBookings,
        bookingStatusBreakdown,
        totalPayments,
        successfulPayments,
        failedPayments,
        paymentStatusBreakdown,
        grossRevenue: Number(grossRevenue.toFixed(2)),
        averagePaymentValue,
        averageBookingValue,
      },
      scope: "FEDERATION_GLOBAL",
      adminRole: user.role,
    };
  }

  // ── CASE 2: COOPERATIVE_ADMIN with an assigned cooperativeId ──────────────────
  const coopDoc = await db.collection("cooperatives").doc(cooperativeId).get();
  if (!coopDoc.exists) {
    throw new ApiError(404, `Assigned cooperative '${cooperativeId}' not found`);
  }
  const coopData = coopDoc.data();
  const memberWorkerIds = Array.isArray(coopData.memberWorkerIds) ? coopData.memberWorkerIds : [];

  const bookingStatusBreakdown = {};
  ALL_BOOKING_STATUSES.forEach((st) => (bookingStatusBreakdown[st] = 0));

  if (memberWorkerIds.length === 0) {
    return {
      analytics: {
        cooperativeId,
        cooperativeName: coopData.name || "",
        totalBookings: 0,
        bookingStatusBreakdown,
        totalPayments: 0,
        successfulPayments: 0,
        failedPayments: 0,
        paymentStatusBreakdown: { SUCCESS: 0, FAILED: 0 },
        grossRevenue: 0,
        averagePaymentValue: 0,
        averageBookingValue: 0,
      },
      scope: `COOPERATIVE_${cooperativeId}`,
      adminRole: user.role,
    };
  }

  const workerChunks = [];
  for (let i = 0; i < memberWorkerIds.length; i += 30) {
    workerChunks.push(memberWorkerIds.slice(i, i + 30));
  }

  let totalBookings = 0;
  let totalPayments = 0;
  let successfulPayments = 0;
  let failedPayments = 0;
  let grossRevenue = 0;
  const paymentStatusBreakdown = { SUCCESS: 0, FAILED: 0 };

  for (const chunk of workerChunks) {
    const [bookingsSnap, paymentsSnap] = await Promise.all([
      db.collection("bookings").where("workerId", "in", chunk).get(),
      db.collection("payments").where("workerId", "in", chunk).get(),
    ]);

    bookingsSnap.forEach((doc) => {
      totalBookings++;
      const st = doc.data().status;
      if (st && bookingStatusBreakdown[st] !== undefined) {
        bookingStatusBreakdown[st]++;
      } else if (st) {
        bookingStatusBreakdown[st] = (bookingStatusBreakdown[st] || 0) + 1;
      }
    });

    paymentsSnap.forEach((doc) => {
      totalPayments++;
      const data = doc.data();
      const pStatus = (data.status || "UNKNOWN").toUpperCase();
      paymentStatusBreakdown[pStatus] = (paymentStatusBreakdown[pStatus] || 0) + 1;

      if (pStatus === "SUCCESS") {
        successfulPayments++;
        grossRevenue += typeof data.amount === "number" ? data.amount : 0;
      } else if (pStatus === "FAILED") {
        failedPayments++;
      }
    });
  }

  const averagePaymentValue =
    successfulPayments > 0 ? Number((grossRevenue / successfulPayments).toFixed(2)) : 0;
  const averageBookingValue =
    totalBookings > 0 ? Number((grossRevenue / totalBookings).toFixed(2)) : 0;

  return {
    analytics: {
      cooperativeId,
      cooperativeName: coopData.name || "",
      totalBookings,
      bookingStatusBreakdown,
      totalPayments,
      successfulPayments,
      failedPayments,
      paymentStatusBreakdown,
      grossRevenue: Number(grossRevenue.toFixed(2)),
      averagePaymentValue,
      averageBookingValue,
    },
    scope: `COOPERATIVE_${cooperativeId}`,
    adminRole: user.role,
  };
};
