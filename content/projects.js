/* portfolio content. Edit this file only.
   Keep every text field to 1-3 sentences. Empty URLs and empty media are hidden. */

window.PORTFOLIO = {

  profile: {
    name: "Srijan Saha",
    role: "Interning Innovater @ TKS",
    line: "I build autonomous drones and vision systems, then measure where they break.",

    readout: [
      { label: "Now",      value: "Training my CV using YOLO to track my DJI Tello" },
      { label: "Building", value: "A prototype anti-aircraft defense tracking system that can track my DJI Tello" },
      { label: "Next up",  value: "Adding a projectile launching system and starting on my own UAV" }
    ],

    about: [
      "I'm a high school builder in TKS. I work on drones, robotics and computer vision, mostly on real hardware.",
      "Most of it is unfinished, and each project says so."
    ],

    links: [
      { label: "GitHub",   url: "" },
      { label: "LinkedIn", url: "" }
    ]
  },

  statuses: {
    demonstrated: { label: "Working demo",      glyph: "solid",  note: "Run end-to-end on real hardware." },
    built:        { label: "Built and running", glyph: "solid",  note: "In use." },
    wip:          { label: "In progress",       glyph: "half",   note: "Partly working." },
    simulation:   { label: "Simulation only",   glyph: "hatch",  note: "Modelled, not measured on hardware." },
    planned:      { label: "Planned",           glyph: "dashed", note: "Designed, not built yet." }
  },

  projects: [

    {
      id: "scene",
      page: "scene.html",
      title: "Scene",
      kicker: "A second brain that sees what you see, and hears what you hear.",
      status: "wip",
      statusLine: "In progress. Follow-through tested with staged conversations.",
      year: "2026",
      tags: ["AI agents", "Gemini 4 Argon", "Wearables"],
      summary: "Scene is a wearable assistant we're building to help people remember conversations and act on what they promised. I built the Follow-Through agent using Gemini 4 Argon to find commitments and prepare actions for review.",
      built: [
        "An agent that finds commitments in transcripts, cites the relevant quotes, and drafts emails, replies, calendar items, and to-dos.",
        "An approval step that opens email or calendar drafts for review and saves approved to-dos."
      ],
      caveatTitle: "Current limits",
      caveats: ["The follow-through agent was tested with staged transcripts. The full glasses-to-action flow has not been verified."],
      links: [{ label: "Team code on GitHub", url: "https://github.com/NayanVangala/argon4hack" }]
    },

    {
      id: "tello-person-following",
      title: "Person-following on a DJI Tello",
      kicker: "Person-following that works, and a delay I haven't explained yet.",
      status: "demonstrated",
      statusLine: "Demonstrated live. The delay is still unexplained.",
      year: "2026",
      tags: ["Computer vision", "DJI Tello", "Control loop"],

      summary: "A Tello finds a person in its camera feed and flies to keep them in frame. Control gets noticeably delayed, and I haven't found the cause yet.",

      built: [
        "Detection, frame-to-frame tracking, and flight commands from the drone's camera feed.",
        "A target-selection step, so the drone follows only the person I pick.",
        "A test harness that logs frame rate and repeated frames."
      ],

      hardest: {
        title: "My first delay measurement was invalid",
        body: "The numbers looked like a stalling stream (26.6 FPS, 964 repeated frames), but the frames were the driver's 400x300 placeholder, not camera data. I threw out the stall diagnosis, and the cause is still open."
      },

      next: [
        "Make the test harness reject placeholder frames.",
        "Re-measure frame rate against a trusted clock.",
        "Log battery level over time, since several causes look the same without it."
      ],

      caveats: [],

      evidence: [
        { type: "video",
          src: "assets/media/tello-person-following-1.mp4",
          poster: "assets/media/tello-person-following-1.jpg",
          caption: "The stall investigation: the suspicious numbers and why they were invalid. 2 min." },
        { type: "video",
          src: "assets/media/tello-person-following-2.mp4",
          poster: "assets/media/tello-person-following-2.jpg",
          caption: "Outdoor flight with the tracking box locked on a person. 11 sec." },
        { type: "video",
          src: "assets/media/tello-person-following-3.mp4",
          poster: "assets/media/tello-person-following-3.jpg",
          caption: "Bench test of the target-selection policy. 10 sec." },
        { type: "video",
          src: "assets/media/tello-person-following-4.mp4",
          poster: "assets/media/tello-person-following-4.jpg",
          caption: "Calibrating the range cues with an ArUco marker at a measured distance. 13 sec." }
      ],

      links: [
        { label: "Main build demo (YouTube)", url: "https://www.youtube.com/watch?v=NNvaL7TUbic" }
      ]
    },

    {
      id: "lunar-rl",
      title: "LunarRL: Teaching an Agent to Land",
      kicker: "An AI agent learns to land a rocket in a 2D simulator.",
      status: "simulation",
      statusLine: "Simulation only. Never tested on a real rocket.",
      year: "2026",
      tags: ["Reinforcement learning", "PPO", "Simulation"],

      summary: "In 100 new test landings, the trained agent landed between the flags 98 times and crashed 0 times. A random agent crashed 90 times.",

      built: [
        "Training and testing scripts for Gymnasium's LunarLander with Stable-Baselines3 PPO.",
        "A fair comparison with random controls on the same 100 starting conditions."
      ],

      hardest: {
        title: "Proving it actually learned",
        body: "One good landing proves little. I tested 100 new starts and counted every crash, including the bad runs."
      },

      next: [
        "Add wind and turbulence.",
        "Compare PPO with another algorithm, such as DQN."
      ],

      caveats: [
        "The simulator gives perfect measurements, with no sensor noise, no wind and no real hardware."
      ],

      explainer: [],

      dataviz: {
        title: "Results",
        data: "assets/data/lunarrl-results.js",
        global: "LUNARRL_RESULTS",
        script: "assets/js/lunarrl-viz.js",
        media: { ppo: "assets/media/lunar-rl-ppo", random: "assets/media/lunar-rl-random" },
        fallback: "Results load with JavaScript. The raw numbers are in lunar-rl/results/ppo_baseline/eval_summary.json."
      },

      evidence: [],

      links: [
        { label: "Open live demo", url: "https://srijan-lunarrl-demo.netlify.app" },
        { label: "Code on GitHub", url: "https://github.com/srijansworks/LunarRL" }
      ]
    },

    {
      id: "maritime-search-simulation",
      title: "Maritime drone search, in simulation",
      kicker: "How long would a drone need to find a boat from a stale satellite tip?",
      status: "simulation",
      statusLine: "Simulation only. The assumptions are still unchecked.",
      year: "2026",
      tags: ["Simulation", "Search planning", "Drones"],

      summary: "The older a satellite tip gets, the bigger the area a drone has to search. The model uses real ship tracks, but the answer depends heavily on assumptions I haven't verified yet.",

      built: [
        "A replay built on real NOAA ship tracks.",
        "A model of how the search area grows as the tip gets older.",
        "A comparison of two search patterns on the same boats."
      ],

      hardest: {
        title: "The answer mostly follows my assumptions",
        body: "Vessel speed, tip age, drone endurance and sensor range move the result more than the search pattern does. So I'm checking those assumptions before building more patterns."
      },

      next: [
        "Write down every assumption, with a source or a clear guess.",
        "Replace the guessed values with published data."
      ],

      caveats: [
        "Simulation results only. Nothing has been flown or tested at sea."
      ],

      evidence: [
        { type: "video",
          src: "assets/media/maritime-search-simulation-1.mp4",
          poster: "assets/media/maritime-search-simulation-1.jpg",
          caption: "One simulated run: a ten-minute-old tip, late drones, and a search that ends when the battery runs out. 47 sec." }
      ],

      links: [
        { label: "Open live demo", url: "https://venerable-belekoy-e16bb4.netlify.app/" }
      ]
    },

    {
      id: "aruco-indoor-mapping",
      title: "Indoor mapping with ArUco markers",
      kicker: "Finding my position from printed markers, starting with recorded flight video.",
      status: "wip",
      statusLine: "In progress. No finished map yet.",
      year: "2026",
      tags: ["ArUco", "Pose estimation", "Mapping"],

      summary: "Printed ArUco markers give a camera something to measure its position against. I'm building it on recorded Tello video first, so the same flight can be replayed while the code changes.",

      built: [
        "A pipeline that detects ArUco markers in recorded Tello video.",
        "Per-marker pose estimates that give the camera's position relative to each marker."
      ],

      hardest: {
        title: "A marker seen at a bad angle gives a wrong pose that looks fine",
        body: "Small, angled or blurry markers still return a pose, often one that flips between two orientations. Once stitched into a map, that error spreads, so I test on video I can replay."
      },

      next: [
        "Calibrate the Tello camera properly.",
        "Reject detections that are small or steeply angled.",
        "Only then move from recorded video to live flight."
      ],

      caveats: [],

      evidence: [],

      links: []
    },

    {
      id: "pan-tilt-pid-sim",
      title: "Pan/tilt PID tracker simulator",
      kicker: "A simulator for learning how a camera should turn to follow a drone.",
      status: "simulation",
      statusLine: "Simulation only. The motors are modelled, not my real servos.",
      year: "2026",
      tags: ["Control theory", "PID", "Simulation"],

      summary: "A well tuned setting caught a 20 degree jump in 0.61 seconds and overshot by 4.5%. A setting that was too low crawled, and one that was too high shook and never settled.",

      built: [
        "An interactive simulator of a two-axis pan/tilt camera following a drone.",
        "Sliders for P, I and D, plus a step test that measures overshoot and settling time.",
        "A Node script that runs the same model without a browser."
      ],

      hardest: {
        title: "Integral windup, and a delay I can't tune away",
        body: "The I term kept building up during big moves and took seconds to unwind, so I only let it add up when the gap is under 5 degrees. The delay was the bigger problem: higher gains made the shaking start sooner instead of fixing the lag."
      },

      next: [
        "Measure my real servos: delay, top speed and dead zone.",
        "Repeat the step test on the real rig."
      ],

      caveats: [
        "The motor and delay values are modelled, not measured on my servos. Settings will need re-tuning on real hardware."
      ],
      caveatTitle: "What this does not prove",

      explainer: [
        { id: "results",
          title: "Results",
          table: {
            head: ["Setting", "Swung past", "Time to settle", "Gap left over", "Gap on the figure-8"],
            rows: [
              ["Too low (Kp 1.5)", "0%", "never", "0.68 degrees", "16.0 degrees"],
              ["Too aggressive (Kp 28)", "87%", "never, keeps shaking", "2.0 degrees", "16.1 degrees"],
              ["Well tuned (Kp 8, Ki 6, Kd 0.5)", "4.5%", "0.61 s", "0.01 degrees", "3.6 degrees"],
              ["Well tuned, no brake (Kd 0)", "28%", "0.94 s", "0.01 degrees", "3.6 degrees"]
            ]
          } }
      ],

      evidence: [
        { type: "image", src: "assets/media/pan-tilt-pid-sim-1.jpg", caption: "The simulator after a step test." }
      ],

      links: [
        { label: "Open live demo", url: "https://pan-tilt-pid-sim.netlify.app" }
      ]
    },

    {
      id: "pan-tilt-tracking-rig",
      title: "Pan/tilt camera tracking rig",
      kicker: "Taking the tracking problem off the drone and onto a bench.",
      status: "planned",
      statusLine: "Planned. Not built yet.",
      year: "2026",
      tags: ["Mechanical", "Servos", "Computer vision"],

      summary: "A two-axis camera mount that keeps a moving subject centred. Testing on a bench means nothing falls out of the sky.",

      built: [
        "Nothing built yet."
      ],

      hardest: {
        title: "I expect the mechanics, not the vision, to set the limit",
        body: "Backlash and servo deadband can make a tracking loop lag or oscillate. I want to measure how much of the error comes from the hardware and how much from the vision."
      },

      next: [
        "Build the mount and get manual control working.",
        "Measure step response on each axis.",
        "Add the detector once the mechanics are understood."
      ],

      caveats: [],

      evidence: [],

      links: []
    },

    {
      id: "buildbase",
      title: "BuildBase",
      kicker: "A platform for learning engineering by building projects.",
      status: "built",
      statusLine: "Built and live.",
      year: "2026",
      tags: ["Web", "Education", "Product"],

      summary: "A learning platform built around projects instead of courses. You pick something to build and work out what you need as you go.",

      built: [
        "A learning platform with two step-by-step pathways: electronics on an Arduino, and CAD in Onshape."
      ],

      hardest: {
        title: "Making it meaningful and easy to digest",
        body: "The content has to be real engineering but easy to follow. I tested it with freshman and middle schoolers to see if they could understand it."
      },

      next: [
        "Add more than one entry-level unit for each topic. Some CAD stages have only one or two articles right now."
      ],

      caveats: [],

      evidence: [],

      links: [
        { label: "Open BuildBase", url: "https://buildbase-learn.netlify.app" }
      ]
    },

    {
      id: "engineering-experimenter",
      title: "Engineering Experimenter",
      kicker: "A debugging skill that won't blame hardware on a measurement it hasn't checked.",
      status: "built",
      statusLine: "Built and in use. It caught the invalid measurement on the Tello project.",
      year: "2026",
      tags: ["Tooling", "Debugging", "Claude Code skill"],

      summary: "A Claude Code skill for investigating physical systems like drones and sensors. It checks that a measurement is valid before using it, and says what is still unmeasured.",

      built: [
        "A validity check that runs before any measurement supports a diagnosis.",
        "A rule that every claim traces back to a log line, a line of code, or a script output.",
        "Several competing causes held open, each with a test that could tell them apart."
      ],

      hardest: {
        title: "Most of the discipline only pays off on a real fault",
        body: "A full investigation is overkill for a simple question. The hard part was getting the tool to use the full process only when a fault has an unknown cause."
      },

      next: [
        "Test it on a case where the first hypothesis is correct, so it doesn't invent doubt."
      ],

      caveats: [],

      evidence: [
        { type: "video",
          src: "assets/media/engineering-experimenter-1.mp4",
          poster: "assets/media/engineering-experimenter-1.jpg",
          caption: "The validity check catching the invalid measurement in the Tello stall investigation. 2 min." }
      ],

      links: []
    },

    {
      id: "engineering-procurement",
      title: "Engineering Procurement",
      kicker: "Turns a parts list into a checked, costed order, and stops before buying.",
      status: "built",
      statusLine: "Built. It fills carts, but a person has to approve the purchase.",
      year: "2026",
      tags: ["Tooling", "Supply chain", "Claude Code skill"],

      summary: "Two Claude Code skills that check each part against its real specs, price the whole order across vendors, and build the carts. Nothing gets bought without an exact human confirmation.",

      built: [
        "A verifier that checks units and tolerances, and marks anything unstated as UNKNOWN instead of guessing.",
        "An optimizer that weighs price, shipping and lead time across the whole order.",
        "A purchase gate that only accepts the phrase \"CONFIRM PURCHASE\" for the exact carts reviewed."
      ],

      hardest: {
        title: "Deciding what the agent is never allowed to do on its own",
        body: "It can't swap in a similar part, round an unknown spec up to a pass, or click the order button. Those choices stay with a person, even when the next step looks obvious."
      },

      next: [
        "Try it on a messy real parts list, like a photo of a whiteboard."
      ],

      caveats: [
        "The worked example uses invented vendor and price data from the bundled demo."
      ],

      evidence: [],

      links: []
    }

  ],

  beyond: {
    eyebrow: "Beyond engineering",
    heading: "Outside the projects",

    lead: [
      "I play drums, earned a black belt, and wrote a research paper about markets.",
      "The gigs pay for the drone parts, and the habits carry over."
    ],

    strands: [

      {
        id: "markets",
        character: "markets",
        eyebrow: "Markets and research",
        title: "A question about market speed, not a trading strategy",
        lede: "I started day trading, and the question I couldn't answer was why faster markets can also be more fragile.",
        body: [
          "So I wrote a paper on it."
        ],

        featured: {
          kind: "Independent research paper",
          title: "Faster Markets, Fragile Anchors: Tokenizing Sovereign Debt",
          abstract: "Tokenizing sovereign bonds could cut costs and widen access. The same continuous trading that helps can also remove the friction that keeps debt markets calm.",
          note: "A student paper. It is not peer-reviewed.",
          links: [
            { label: "Read the paper", url: "https://docs.google.com/document/d/1F4UTids8I_BAseHBrbMrWlAaVOxbRT4MuIZyUPk4IFg/edit?usp=sharing" }
          ]
        },

        alsoTitle: "Also published",
        also: [
          { title: "Why Flies Are More Efficient Than Autonomous Drones",
            venue: "Medium",
            note: "What insect flight does better than the drones I build.",
            url: "https://medium.com/@srijansaha.work/why-flies-are-more-efficient-than-autonomous-drones-4d31283cb369" }
        ],

        media: []
      },

      {
        id: "music",
        character: "music",
        eyebrow: "Music",
        title: "Ten years behind a drum kit",
        lede: "I've played drums for more than ten years. A drummer's job is to be the steady reference everyone trusts, which is a lot like a control loop.",
        body: [
          "Leading the Jazzinators taught me the part that isn't playing: calling tunes and keeping a rehearsal together.",
          "The weekend gigs pay for my drone parts."
        ],

        rosterTitle: "Where I play",
        roster: [
          { org: "San Jose Youth Symphony Jazz Ensemble",         role: "Jazz drummer for three years" },
          { org: "SJYS Philharmonic Orchestra",                   role: "Drummer. Touring Europe next summer" },
          { org: "East Bay Traditional Jazz Society Jazzinators", role: "Ensemble leader and longtime senior member" },
          { org: "Christ Community Church of Milpitas",           role: "Professional church drumming gigs" },
          { org: "Downtown Pleasanton",                           role: "Weekend sets that fund the engineering" }
        ],

        media: []
      },

      {
        id: "martial-arts",
        character: "martial",
        eyebrow: "Martial arts",
        title: "Black belt, West Coast Martial Arts",
        lede: "Earning a black belt meant doing the same basics correctly for years.",
        body: [
          "It taught me to stay with the boring work, which is most of engineering: the fourteenth test flight, not the first."
        ],

        media: []
      }

    ]
  }
};
