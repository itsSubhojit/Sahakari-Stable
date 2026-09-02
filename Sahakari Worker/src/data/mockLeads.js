export const initialLeads = [
  {
    id: "REQ-8472",
    title: "Emergency Pipe Repair",
    category: "Plumbing",
    categoryIcon: "plumbing",
    distance: "1.2 mi away",
    address: "Flat 402, Green Glen Heights, Sector 14, Ring Road",
    verified: true,
    urgency: "EMERGENCY",
    urgencyColor: "error",
    slaSecondsRemaining: 720, // 12 mins
    acceptedByWorker: false,
    aiMode: "OFF", // 'OFF' | 'COPILOT' | 'AUTOPILOT'
    aiDraft: "Hi Ramesh! I've activated my AI assistant. Suresh can be at Flat 402 in 25 minutes. We can resolve the T-junction copper pipe leak for $185.00, including copper parts and a 90-day coop warranty. Let me know if that works!",
    customer: {
      name: "Ramesh Sharma",
      rating: 4.8,
      reviewCount: 34,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      joinedDate: "Member since Mar 2023",
      completedJobs: 18,
      verifiedPayment: true,
      escrowLocked: true
    },
    jobScope: {
      summary: "Severe copper pipe burst under kitchen sink valve. Water valve currently shut off. Needs immediate replacement of T-joint, pressure test, and sealant.",
      toolsRequired: ["15mm Copper Pipe Cutter", "Propane/MAPP Torch or Compression Fittings", "Teflon Tape", "Basin Wrench"],
      photos: [
        {
          id: 1,
          url: "/images/pipe_leak.jpg",
          caption: "Corroded T-junction and active dripping under sink basin"
        }
      ],
      voiceNote: {
        duration: "0:24",
        transcription: "Hi, water was gushing out from the main T-valve under the sink. We managed to turn the stopcock off, but we have no water in the kitchen now. Please come with replacement parts!"
      },
      preferredTiming: "Immediate (Within 45 mins)",
      accessInstructions: "Guard at Gate 2 will give visitor parking pass. Take elevator B to 4th floor."
    },
    financials: {
      currentPendingOffer: 185.00,
      customerInitialOffer: 150.00,
      workerLastCounter: 220.00,
      coopFeePercent: 3.0, // Sahakari cooperative 3% fee
      estimatedMaterialCost: 35.00
    },
    status: "YOUR_TURN", // 'YOUR_TURN' | 'CUSTOMER_TURN' | 'ACCEPTED' | 'REJECTED'
    thread: [
      {
        id: "msg-1",
        sender: "CUSTOMER",
        senderName: "Ramesh Sharma",
        time: "10:42 AM",
        text: "Initial offer for urgent response. Water is off so need it resolved quickly.",
        amount: 150.00,
        type: "OFFER"
      },
      {
        id: "msg-2",
        sender: "WORKER",
        senderName: "You (Suresh Patel)",
        time: "10:45 AM",
        text: "Requires specialized brass compression fittings and emergency transit not included in base rate.",
        amount: 220.00,
        type: "COUNTER"
      },
      {
        id: "msg-3",
        sender: "CUSTOMER",
        senderName: "Ramesh Sharma",
        time: "10:48 AM",
        text: "Can we meet in the middle? I need this done ASAP and will write a 5-star review.",
        amount: 185.00,
        type: "COUNTER",
        isPending: true
      }
    ]
  },
  {
    id: "REQ-8480",
    title: "AC Inverter Compressor Diagnostic & Gas Top-up",
    category: "HVAC & Appliances",
    categoryIcon: "mode_fan",
    distance: "2.8 mi away",
    address: "Villa 19, Palm Grove Meadows, East Avenue",
    verified: true,
    urgency: "HIGH PRIORITY",
    urgencyColor: "secondary",
    slaSecondsRemaining: 1800, // 30 mins
    acceptedByWorker: true,
    aiMode: "COPILOT",
    aiDraft: "Hi Priya! I can handle the 1.5 Ton Split AC outdoor unit capacitor check and refrigerant gas top-up. The price of $240.00 works perfectly. I will check the capacitor terminals and trip logic.",
    customer: {
      name: "Priya Nair",
      rating: 4.9,
      reviewCount: 42,
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      joinedDate: "Member since Jan 2022",
      completedJobs: 26,
      verifiedPayment: true,
      escrowLocked: true
    },
    jobScope: {
      summary: "1.5 Ton Split AC outdoor unit tripping circuit breaker after 5 minutes of running. Needs capacitor check and R32 refrigerant top-up.",
      toolsRequired: ["Digital Multimeter", "R32 Manifold Gauge", "Vacuum Pump", "Dual Run Capacitor 50+5 uF"],
      photos: [
        {
          id: 2,
          url: "/images/ac_repair.jpg",
          caption: "Outdoor compressor unit electrical terminals and diagnostic port"
        }
      ],
      voiceNote: {
        duration: "0:18",
        transcription: "The compressor fan turns on but makes a buzzing hum and trips the main MCB switch. Hope it just needs a capacitor replacement."
      },
      preferredTiming: "Today before 4:00 PM",
      accessInstructions: "Outdoor unit mounted on 1st floor balcony ledge, safe ladder access provided."
    },
    financials: {
      currentPendingOffer: 240.00,
      customerInitialOffer: 200.00,
      workerLastCounter: 275.00,
      coopFeePercent: 3.0,
      estimatedMaterialCost: 60.00
    },
    status: "YOUR_TURN",
    thread: [
      {
        id: "ac-msg-1",
        sender: "CUSTOMER",
        senderName: "Priya Nair",
        time: "01:15 PM",
        text: "Looking for certified technician to check AC outdoor unit tripping breaker.",
        amount: 200.00,
        type: "OFFER"
      },
      {
        id: "ac-msg-2",
        sender: "WORKER",
        senderName: "You (Suresh Patel)",
        time: "01:22 PM",
        text: "Includes electrical diagnostic, new 55uF capacitor and 300g R32 topup with 90-day guarantee.",
        amount: 275.00,
        type: "COUNTER"
      },
      {
        id: "ac-msg-3",
        sender: "CUSTOMER",
        senderName: "Priya Nair",
        time: "01:30 PM",
        text: "Could you do $240 if I book right now?",
        amount: 240.00,
        type: "COUNTER",
        isPending: true
      }
    ]
  },
  {
    id: "REQ-8491",
    title: "Distribution Board MCB Tripping & Rewiring",
    category: "Electrical",
    categoryIcon: "electric_bolt",
    distance: "3.5 mi away",
    address: "B-104, Sunrise Residency, Outer Ring",
    verified: true,
    urgency: "STANDARD",
    urgencyColor: "primary",
    slaSecondsRemaining: 3200,
    acceptedByWorker: false,
    aiMode: "OFF",
    aiDraft: "Hi Amitabh! Suresh's AI negotiator here. I can inspect the 32A RCD board and find the leakage for your initial bid of $160.00. I have insulation resistance meters ready.",
    customer: {
      name: "Amitabh Sen",
      rating: 4.7,
      reviewCount: 15,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      joinedDate: "Member since Sep 2023",
      completedJobs: 9,
      verifiedPayment: true,
      escrowLocked: true
    },
    jobScope: {
      summary: "Living room and master bedroom sub-circuits tripping the 32A RCD. Suspected neutral-to-ground leakage.",
      toolsRequired: ["Insulation Resistance Tester (Megger)", "Wire Strippers", "Spare 16A Single Pole MCBs"],
      photos: [],
      voiceNote: null,
      preferredTiming: "Tomorrow Morning (9:00 AM - 12:00 PM)",
      accessInstructions: "Ring bell B-104. Parking spot #42."
    },
    financials: {
      currentPendingOffer: 160.00,
      customerInitialOffer: 160.00,
      workerLastCounter: null,
      coopFeePercent: 3.0,
      estimatedMaterialCost: 20.00
    },
    status: "YOUR_TURN",
    thread: [
      {
        id: "el-msg-1",
        sender: "CUSTOMER",
        senderName: "Amitabh Sen",
        time: "03:10 PM",
        text: "Need inspection and fault isolation for tripping MCB board.",
        amount: 160.00,
        type: "OFFER",
        isPending: true
      }
    ]
  }
];

export const mockWorkerProfile = {
  name: "Suresh Patel",
  role: "Senior Master Plumber & HVAC Specialist",
  rating: 4.9,
  reviewsCount: 148,
  coopId: "SAH-COOP-8821",
  tier: "Tier 1 Gold Partner",
  sharesHeld: 320,
  sharesValue: "$3,840.00",
  todayEarnings: 412.50,
  monthlyEarnings: 4680.00,
  completedJobsToday: 3,
  acceptanceRate: "96%",
  onTimeRate: "99%",
  avatar: "/images/worker_avatar.jpg",
  verifiedSkills: ["Master Plumbing", "Gas Piping", "HVAC R32/R410A", "High-Pressure Jetting", "Emergency Shutoff"]
};

export const quickMessageCanned = [
  "I have the exact replacement parts in my service vehicle.",
  "Can be at your doorstep in under 25 minutes.",
  "Price includes 90-day Sahakari Cooperative warranty.",
  "Would you like me to inspect secondary shutoff valves as well?",
  "Please keep the main area clear of valuables."
];
