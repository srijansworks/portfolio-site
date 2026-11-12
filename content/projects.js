/* Portfolio content. Source of truth for generated pages. */
window.PORTFOLIO = {
  "profile": {
    "name": "Srijan Saha",
    "role": "Intern @ TKS",
    "line": "working on vision systems",
    "readout": [
      {
        "label": "Now",
        "value": "Training my CV using YOLO to track my DJI Tello"
      },
      {
        "label": "Building",
        "value": "A prototype anti-aircraft defense tracking system that can track my DJI Tello"
      },
      {
        "label": "Next up",
        "value": "Adding a projectile launching system and starting on my own UAV"
      }
    ],
    "about": [
      "I'm a high school builder in TKS. I work on drones, robotics and computer vision, mostly on real hardware.",
      "Most of it is unfinished, and each project says so."
    ],
    "links": [
      {
        "label": "GitHub",
        "url": "https://github.com/srijansworks"
      },
      {
        "label": "LinkedIn",
        "url": "https://www.linkedin.com/in/srijan-saha-800723432/"
      },
      {
        "label": "Email",
        "url": "mailto:srijansaha.work@gmail.com"
      },
      {
        "label": "510 359 6679",
        "url": "tel:+15103596679"
      }
    ],
    "greeting": "Hi, I'm Srijan.",
    "aliases": [
      "lazy genius",
      "drumma boi",
      "rodrick",
      "d1 vibecoder",
      "generational larper",
      "the trencher",
      "band kid",
      "lego builder",
      "larper",
      "did i mention larper?"
    ]
  },
  "statuses": {
    "demonstrated": {
      "label": "Working demo",
      "glyph": "solid",
      "note": "Run end-to-end on real hardware."
    },
    "built": {
      "label": "Built and running",
      "glyph": "solid",
      "note": "In use."
    },
    "wip": {
      "label": "In progress",
      "glyph": "half",
      "note": "Partly working."
    },
    "closed": {
      "label": "Completed, discontinued",
      "glyph": "hatch",
      "note": "Finished as a research study. Not pursued as a product."
    },
    "simulation": {
      "label": "Simulation only",
      "glyph": "hatch",
      "note": "Modelled, not measured on hardware."
    },
    "planned": {
      "label": "Planned",
      "glyph": "dashed",
      "note": "Designed, not built yet."
    }
  },
  "projects": [
    {
      "id": "autoprompter",
      "title": "AutoPrompter",
      "kicker": "Improve a draft with Gemini, then get a second review from Cursor before sending.",
      "status": "wip",
      "statusLine": "Working in Aside on ChatGPT. Claude support is still being tested.",
      "year": "2026",
      "tags": [
        "JavaScript",
        "Browser extension",
        "Gemini API",
        "Cursor CLI"
      ],
      "summary": "A personal browser extension for improving prompts inside ChatGPT and Claude. Gemini rewrites the draft, an optional local Cursor helper reviews coding prompts, and the user decides what to keep or send. A per-site Intercept switch lets quick questions go through normally.",
      "built": [
        "A review panel with editable Gemini rewrites, assumptions, and changes.",
        "An optional Cursor CLI helper for a second review of coding prompts.",
        "A saved Intercept on/off switch beside Improve prompt, with manual improvement available when interception is off."
      ],
      "caveats": [
        "ChatGPT improvement and Cursor review were tested in Aside. Claude rewrites timed out during testing.",
        "Draft replacement can report a failed write when the editor changes paragraph spacing.",
        "Requires a Gemini API key; Cursor review also requires the local Cursor CLI and helper."
      ],
      "hardest": {
        "title": "Working with changing chat editors",
        "body": "The extension has to preserve the draft, handle browser-extension reloads, and confirm that an editable chat box actually accepted a replacement. Site-specific editor behavior is still being refined."
      },
      "next": [
        "Make draft replacement verification robust to paragraph spacing.",
        "Improve reliability on Claude and test more browser versions."
      ],
      "evidence": [],
      "links": [
        {
          "label": "View source on GitHub",
          "url": "https://github.com/srijansworks/Auto-PromptEngineer"
        }
      ],
      "listingUrl": "https://github.com/srijansworks/Auto-PromptEngineer"
    },
    {
      "id": "scene",
      "page": "scene.html",
      "title": "Scene",
      "kicker": "A second brain that sees what you see, and hears what you hear.",
      "status": "wip",
      "statusLine": "In progress. Follow-through tested with staged conversations.",
      "year": "2026",
      "tags": [
        "AI agents",
        "Gemini 4 Argon",
        "Wearables"
      ],
      "summary": "Scene is a wearable assistant we're building to help people remember conversations and act on what they promised. I built the Follow-Through agent using Gemini 4 Argon to find commitments and prepare actions for review.",
      "built": [
        "An agent that finds commitments in transcripts, cites the relevant quotes, and drafts emails, replies, calendar items, and to-dos.",
        "An approval step that opens email or calendar drafts for review and saves approved to-dos."
      ],
      "caveatTitle": "Current limits",
      "caveats": [
        "The follow-through agent was tested with staged transcripts. The full glasses-to-action flow has not been verified."
      ],
      "links": [
        {
          "label": "Team code on GitHub",
          "url": "https://github.com/NayanVangala/argon4hack"
        }
      ]
    },
    {
      "id": "tello-person-following",
      "title": "Person-following on a DJI Tello",
      "kicker": "Person-following that works, and a delay I haven't explained yet.",
      "status": "demonstrated",
      "statusLine": "Demonstrated live. The delay is still unexplained.",
      "year": "2026",
      "tags": [
        "Computer vision",
        "DJI Tello",
        "Control loop"
      ],
      "summary": "A Tello finds a person in its camera feed and flies to keep them in frame. Control gets noticeably delayed, and I haven't found the cause yet.",
      "built": [
        "Detection, frame-to-frame tracking, and flight commands from the drone's camera feed.",
        "A target-selection step, so the drone follows only the person I pick.",
        "A test harness that logs frame rate and repeated frames."
      ],
      "hardest": {
        "title": "My first delay measurement was invalid",
        "body": "The numbers looked like a stalling stream (26.6 FPS, 964 repeated frames), but the frames were the driver's 400x300 placeholder, not camera data. I threw out the stall diagnosis, and the cause is still open."
      },
      "next": [
        "Make the test harness reject placeholder frames.",
        "Re-measure frame rate against a trusted clock.",
        "Log battery level over time, since several causes look the same without it."
      ],
      "caveats": [],
      "evidence": [
        {
          "type": "video",
          "src": "assets/media/tello-person-following-1.mp4",
          "poster": "assets/media/tello-person-following-1.jpg",
          "caption": "The stall investigation: the suspicious numbers and why they were invalid. 2 min."
        },
        {
          "type": "video",
          "src": "assets/media/tello-person-following-2.mp4",
          "poster": "assets/media/tello-person-following-2.jpg",
          "caption": "Outdoor flight with the tracking box locked on a person. 11 sec."
        },
        {
          "type": "video",
          "src": "assets/media/tello-person-following-3.mp4",
          "poster": "assets/media/tello-person-following-3.jpg",
          "caption": "Bench test of the target-selection policy. 10 sec."
        },
        {
          "type": "video",
          "src": "assets/media/tello-person-following-4.mp4",
          "poster": "assets/media/tello-person-following-4.jpg",
          "caption": "Calibrating the range cues with an ArUco marker at a measured distance. 13 sec."
        }
      ],
      "links": [
        {
          "label": "Main build demo (YouTube)",
          "url": "https://www.youtube.com/watch?v=NNvaL7TUbic"
        }
      ]
    },
    {
      "id": "lunar-rl",
      "title": "LunarRL: Teaching an Agent to Land",
      "kicker": "An AI agent learns to land a rocket in a 2D simulator.",
      "status": "simulation",
      "statusLine": "Simulation only. Never tested on a real rocket.",
      "year": "2026",
      "tags": [
        "Reinforcement learning",
        "PPO",
        "Simulation"
      ],
      "summary": "In 100 new test landings, the trained agent landed between the flags 98 times and crashed 0 times. A random agent crashed 90 times.",
      "built": [
        "Training and testing scripts for Gymnasium's LunarLander with Stable-Baselines3 PPO.",
        "A fair comparison with random controls on the same 100 starting conditions."
      ],
      "hardest": {
        "title": "Proving it actually learned",
        "body": "One good landing proves little. I tested 100 new starts and counted every crash, including the bad runs."
      },
      "next": [
        "Add wind and turbulence.",
        "Compare PPO with another algorithm, such as DQN."
      ],
      "caveats": [
        "The simulator gives perfect measurements, with no sensor noise, no wind and no real hardware."
      ],
      "explainer": [],
      "dataviz": {
        "title": "Results",
        "data": "assets/data/lunarrl-results.js",
        "global": "LUNARRL_RESULTS",
        "script": "assets/js/lunarrl-viz.js",
        "media": {
          "ppo": "assets/media/lunar-rl-ppo",
          "random": "assets/media/lunar-rl-random"
        },
        "fallback": "Results load with JavaScript. The raw numbers are in lunar-rl/results/ppo_baseline/eval_summary.json."
      },
      "evidence": [],
      "links": [
        {
          "label": "Open live demo",
          "url": "https://srijan-lunarrl-demo.netlify.app"
        },
        {
          "label": "Code on GitHub",
          "url": "https://github.com/srijansworks/LunarRL"
        }
      ]
    },
    {
      "id": "maritime-search-simulation",
      "title": "Maritime cue-and-search drone planning",
      "kicker": "A completed research project: can a drone find a boat that has moved since its satellite tip?",
      "status": "closed",
      "statusLine": "Completed and discontinued as a product. Simulation only; nothing was flown at sea.",
      "year": "2026",
      "tags": [
        "Simulation",
        "Search planning",
        "Drones"
      ],
      "summary": "A satellite spots a boat, but by the time a drone arrives the boat has moved. I built a simulation to test how old a tip can get before a drone team can no longer find it, and whether a probability-based search plan beats standard patterns. The investigation showed the answer depends on assumptions I could not validate, so I stopped pursuing a product and kept the work as a research record.",
      "caveats": [
        "Everything on this page is a result from my simulation, under the assumptions listed below. None of it is a measured real-world performance.",
        "The review that led me to stop was an AI-assisted, multi-perspective review with web research. It was not a panel of human experts, and its claims about satellite latency and hardware limits are not independently verified.",
        "The simulation had flaws I confirmed in the code: the planner's guesses came from the same boat model that made the test boats, and the real-track prior did not exclude vessels that also appeared in the test day."
      ],
      "caveatTitle": "What this does not prove",
      "explainer": [
        {
          "id": "problem",
          "title": "The problem",
          "paras": [
            "Standard Coast Guard search patterns were designed for slow, drifting targets. A boat moving at 10 to 30 knots leaves the old tip behind quickly, so the area to search grows with the square of how old the tip is.",
            "The repository is named Traffic-drone because it began as a human-trafficking idea. There is no road-traffic or triangulation component. I checked the original premise (traffickers hide under cloud) early and found it was wrong, because radar satellites see through cloud, so I changed the question to what happens after a tip."
          ]
        },
        {
          "id": "results",
          "title": "What the experiments showed",
          "paras": [
            "Percent of simulated boats found within the drone's endurance, 2,000 boats per setting for the straight-line runs. These describe the model, not the real world."
          ],
          "table": {
            "head": [
              "Setting",
              "Result"
            ],
            "rows": [
              [
                "1 drone, 10 min tip: standard square / ring / smart",
                "0.4% / 14.8% / 21.9%"
              ],
              [
                "3 drones, 10 min tip: smart separate / smart shared map",
                "31.6% / 49.8%"
              ],
              [
                "1 drone with a 2 min tip vs 3 drones with a 10 min tip",
                "81.8% vs 49.8%"
              ],
              [
                "Camera range 1 km vs 500 m (3 drones, shared map)",
                "51.8% to 28.1%"
              ],
              [
                "Real fishing paths, 3 drones, 10 min tip: spiral / smart / smart learned from other days",
                "80.1% / 88.1% / 92.2%"
              ],
              [
                "Experiment 26: 10,220 real AIS gaps of 12 to 24 h: circle / learned / straight-line",
                "25.4% / 24.5% / 0.0%"
              ]
            ]
          }
        },
        {
          "id": "exp26",
          "title": "Experiment 26: the circle matched the planner",
          "paras": [
            "I tested where boats that switched off their tracker actually reappear, using Global Fishing Watch data. With no heading information, a plain circle around the last known position caught 25.4% of boats. My learned motion model caught 24.5%. My original straight-line guess caught 0.0%, because these boats mostly loiter instead of running.",
            "The lesson is specific: the smart search only helps when the tip carries direction or speed. Without that, there is nothing to exploit. This test covers large fishing vessels and 12 to 24 hour tips, so it says nothing about small boats or fresh tips."
          ]
        },
        {
          "id": "assumptions",
          "title": "Assumptions that proved unrealistic",
          "list": [
            "A perfect 360 degree camera out to 1 km. Halving the range cut the shared-map result from 51.8% to 28.1%.",
            "Tips only 2 to 10 minutes old with 100 m error. Vendor-reported satellite detection latencies are reported in hours, which I did not verify, and my own simulation finds under 6% for one drone at 30+ minutes.",
            "No transit, launch, comms, weather or airspace, and open-loop flight paths.",
            "Straight-line boats and legal AIS boats, instead of boats evading a patrol.",
            "A planner that is not new: a particle cloud with searched water crossed off is the architecture of established search-planning systems."
          ]
        },
        {
          "id": "stop",
          "title": "Why I stopped",
          "paras": [
            "The headline numbers rested on the assumptions above. My strongest finding, that tip age dominates, points at data latency and logistics rather than at a better planner. I had no evidence that any operator needed this or would pay for it. Continuing would have meant polishing a demo on top of unvalidated inputs, so I closed the product direction and kept the work."
          ]
        },
        {
          "id": "learned",
          "title": "What I learned",
          "list": [
            "A simulation shows what follows from its assumptions, so validate the biggest assumption first. I validated it last.",
            "A win over a weak baseline is not a strong result. A plain circle was the baseline that mattered.",
            "Write the prediction down before the experiment. It kept me from rationalizing results afterwards.",
            "Negative results are results, and knowing when the evidence says stop is part of engineering."
          ]
        }
      ],
      "built": [
        "A Python simulation (about 2,200 lines, numpy and matplotlib) of boats, drones and cameras, with a mechanics test suite.",
        "Four search planners (expanding square, ring search, a particle-cloud probability search, and a shared-map version for drone teams), plus Brown's FAB as a comparison.",
        "Replays of real fishing and pleasure-craft tracks from public NOAA AIS data, and a test on 10,220 real AIS-gap events from Global Fishing Watch.",
        "Confidence intervals on the results and a written prediction for each experiment, committed before I ran it.",
        "A 2D and 3D browser replay of the simulated runs."
      ],
      "hardest": {
        "title": "The planner's edge disappeared when I tested it honestly",
        "body": "On real paths the smart search beat a plain spiral by only a few points, and in Experiment 26 a circle matched it. Fixing that would have needed real tip data, a realistic camera model and vessel-disjoint testing that I did not have, so I documented the gap instead of covering it up."
      },
      "next": [],
      "evidence": [
        {
          "type": "video",
          "src": "assets/media/maritime-search-simulation-1.mp4",
          "poster": "assets/media/maritime-search-simulation-1.jpg",
          "caption": "One simulated run: a ten-minute-old tip, late drones, and a search that ends when the battery runs out. 47 sec."
        },
        {
          "type": "image",
          "src": "assets/media/maritime-search-found-vs-tip-age.png",
          "caption": "Simulation output: share of boats found vs tip age, 3 drones, perfect 1 km camera, straight-line boats. A fresh tip beats a smarter search."
        },
        {
          "type": "image",
          "src": "assets/media/maritime-search-snapshot-10min.png",
          "caption": "Simulation output: the three single-drone paths for a 10 minute old tip. The orange dots are where the boat could be when the drone arrives."
        }
      ],
      "links": [
        {
          "label": "Open live demo",
          "url": "https://venerable-belekoy-e16bb4.netlify.app/"
        },
        {
          "label": "Code and write-up on GitHub",
          "url": "https://github.com/srijansworks/Traffic-drone"
        },
        {
          "label": "Research summary",
          "url": "https://github.com/srijansworks/Traffic-drone/blob/main/docs/RESEARCH_SUMMARY.md"
        }
      ]
    },
    {
      "id": "pan-tilt-pid-sim",
      "title": "Pan/tilt PID tracker simulator",
      "kicker": "A simulator for learning how a camera should turn to follow a drone.",
      "status": "simulation",
      "statusLine": "Simulation only. The motors are modelled, not my real servos.",
      "year": "2026",
      "tags": [
        "Control theory",
        "PID",
        "Simulation"
      ],
      "summary": "A well tuned setting caught a 20 degree jump in 0.61 seconds and overshot by 4.5%. A setting that was too low crawled, and one that was too high shook and never settled.",
      "built": [
        "An interactive simulator of a two-axis pan/tilt camera following a drone.",
        "Sliders for P, I and D, plus a step test that measures overshoot and settling time.",
        "A Node script that runs the same model without a browser."
      ],
      "hardest": {
        "title": "Integral windup, and a delay I can't tune away",
        "body": "The I term kept building up during big moves and took seconds to unwind, so I only let it add up when the gap is under 5 degrees. The delay was the bigger problem: higher gains made the shaking start sooner instead of fixing the lag."
      },
      "next": [
        "Measure my real servos: delay, top speed and dead zone.",
        "Repeat the step test on the real rig."
      ],
      "caveats": [
        "The motor and delay values are modelled, not measured on my servos. Settings will need re-tuning on real hardware."
      ],
      "caveatTitle": "What this does not prove",
      "explainer": [
        {
          "id": "results",
          "title": "Results",
          "table": {
            "head": [
              "Setting",
              "Swung past",
              "Time to settle",
              "Gap left over",
              "Gap on the figure-8"
            ],
            "rows": [
              [
                "Too low (Kp 1.5)",
                "0%",
                "never",
                "0.68 degrees",
                "16.0 degrees"
              ],
              [
                "Too aggressive (Kp 28)",
                "87%",
                "never, keeps shaking",
                "2.0 degrees",
                "16.1 degrees"
              ],
              [
                "Well tuned (Kp 8, Ki 6, Kd 0.5)",
                "4.5%",
                "0.61 s",
                "0.01 degrees",
                "3.6 degrees"
              ],
              [
                "Well tuned, no brake (Kd 0)",
                "28%",
                "0.94 s",
                "0.01 degrees",
                "3.6 degrees"
              ]
            ]
          }
        }
      ],
      "evidence": [
        {
          "type": "image",
          "src": "assets/media/pan-tilt-pid-sim-1.jpg",
          "caption": "The simulator after a step test."
        }
      ],
      "links": [
        {
          "label": "Open live demo",
          "url": "https://pan-tilt-pid-sim.netlify.app"
        }
      ]
    },
    {
      "id": "pan-tilt-tracking-rig",
      "title": "Pan/tilt anti-aircraft defense system",
      "kicker": "A prototype tracking system for my DJI Tello.",
      "status": "wip",
      "statusLine": "Work in progress. Hardware build and tracking experiments.",
      "year": "2026",
      "tags": [
        "Mechanical",
        "Servos",
        "Computer vision"
      ],
      "summary": "A prototype anti-aircraft defense tracking system that can track my DJI Tello",
      "built": [
        "Successful OpenCV tracking of the Tello.",
        "A rough setup for the servo motion."
      ],
      "hardest": {
        "title": "I expect the mechanics, not the vision, to set the limit",
        "body": "Backlash and servo deadband can make a tracking loop lag or oscillate. I want to measure how much of the error comes from the hardware and how much from the vision."
      },
      "next": [
        "Build the mount and get manual control working.",
        "Measure step response on each axis.",
        "Add the detector once the mechanics are understood."
      ],
      "caveats": [],
      "evidence": [
        {
          "type": "video",
          "src": "assets/media/previews/pan-tilt-rig-preview.mp4",
          "poster": "assets/media/previews/pan-tilt-rig-poster.jpg",
          "caption": "Rough servo-motion setup, recorded on the bench. Original clip supplied by Srijan."
        }
      ],
      "links": [],
      "progress": [
        {
          "label": "Now",
          "value": "Training my CV using YOLO to track my DJI Tello"
        },
        {
          "label": "Building",
          "value": "A prototype anti-aircraft defense tracking system that can track my DJI Tello"
        },
        {
          "label": "Next up",
          "value": "Adding a projectile launching system and starting on my own UAV"
        }
      ]
    },
    {
      "id": "buildbase",
      "title": "BuildBase",
      "kicker": "A platform for learning engineering by building projects.",
      "status": "built",
      "statusLine": "Built and live.",
      "year": "2026",
      "tags": [
        "Web",
        "Education",
        "Product"
      ],
      "summary": "A learning platform built around projects instead of courses. You pick something to build and work out what you need as you go.",
      "built": [
        "A learning platform with two step-by-step pathways: electronics on an Arduino, and CAD in Onshape."
      ],
      "hardest": {
        "title": "Making it meaningful and easy to digest",
        "body": "The content has to be real engineering but easy to follow. I tested it with freshman and middle schoolers to see if they could understand it."
      },
      "next": [
        "Add more than one entry-level unit for each topic. Some CAD stages have only one or two articles right now."
      ],
      "caveats": [],
      "evidence": [],
      "links": [
        {
          "label": "Open BuildBase",
          "url": "https://buildbase-learn.netlify.app"
        }
      ]
    },
    {
      "id": "engineering-experimenter",
      "title": "Engineering Experimenter",
      "kicker": "A debugging skill that won't blame hardware on a measurement it hasn't checked.",
      "status": "built",
      "statusLine": "Built and in use. It caught the invalid measurement on the Tello project.",
      "year": "2026",
      "tags": [
        "Tooling",
        "Debugging",
        "Claude Code skill"
      ],
      "summary": "A Claude Code skill for investigating physical systems like drones and sensors. It checks that a measurement is valid before using it, and says what is still unmeasured.",
      "built": [
        "A validity check that runs before any measurement supports a diagnosis.",
        "A rule that every claim traces back to a log line, a line of code, or a script output.",
        "Several competing causes held open, each with a test that could tell them apart."
      ],
      "hardest": {
        "title": "Most of the discipline only pays off on a real fault",
        "body": "A full investigation is overkill for a simple question. The hard part was getting the tool to use the full process only when a fault has an unknown cause."
      },
      "next": [
        "Test it on a case where the first hypothesis is correct, so it doesn't invent doubt."
      ],
      "caveats": [],
      "evidence": [
        {
          "type": "video",
          "src": "assets/media/engineering-experimenter-1.mp4",
          "poster": "assets/media/engineering-experimenter-1.jpg",
          "caption": "The validity check catching the invalid measurement in the Tello stall investigation. 2 min."
        }
      ],
      "links": []
    },
    {
      "id": "engineering-procurement",
      "title": "Engineering Procurement",
      "kicker": "Turns a parts list into a checked, costed order, and stops before buying.",
      "status": "built",
      "statusLine": "Built. It fills carts, but a person has to approve the purchase.",
      "year": "2026",
      "tags": [
        "Tooling",
        "Supply chain",
        "Claude Code skill"
      ],
      "summary": "Two Claude Code skills that check each part against its real specs, price the whole order across vendors, and build the carts. Nothing gets bought without an exact human confirmation.",
      "built": [
        "A verifier that checks units and tolerances, and marks anything unstated as UNKNOWN instead of guessing.",
        "An optimizer that weighs price, shipping and lead time across the whole order.",
        "A purchase gate that only accepts the phrase \"CONFIRM PURCHASE\" for the exact carts reviewed."
      ],
      "hardest": {
        "title": "Deciding what the agent is never allowed to do on its own",
        "body": "It can't swap in a similar part, round an unknown spec up to a pass, or click the order button. Those choices stay with a person, even when the next step looks obvious."
      },
      "next": [
        "Try it on a messy real parts list, like a photo of a whiteboard."
      ],
      "caveats": [
        "The worked example uses invented vendor and price data from the bundled demo."
      ],
      "evidence": [],
      "links": []
    }
  ],
  "beyond": {
    "eyebrow": "Beyond engineering",
    "heading": "Outside the projects",
    "lead": [
      "I play drums, earned a black belt, and wrote a research paper about markets.",
      "The gigs pay for the drone parts, and the habits carry over."
    ],
    "strands": [
      {
        "id": "markets",
        "character": "markets",
        "eyebrow": "Markets and research",
        "title": "A question about market speed, not a trading strategy",
        "lede": "I started day trading, and the question I couldn't answer was why faster markets can also be more fragile.",
        "body": [
          "So I wrote a paper on it."
        ],
        "featured": {
          "kind": "Independent research paper",
          "title": "Faster Markets, Fragile Anchors: Tokenizing Sovereign Debt",
          "abstract": "Tokenizing sovereign bonds could cut costs and widen access. The same continuous trading that helps can also remove the friction that keeps debt markets calm.",
          "note": "A student paper. It is not peer-reviewed.",
          "links": [
            {
              "label": "Read the paper",
              "url": "https://docs.google.com/document/d/1F4UTids8I_BAseHBrbMrWlAaVOxbRT4MuIZyUPk4IFg/edit?usp=sharing"
            }
          ]
        },
        "alsoTitle": "Also published",
        "also": [
          {
            "title": "Why Flies Are More Efficient Than Autonomous Drones",
            "venue": "Medium",
            "note": "What insect flight does better than the drones I build.",
            "url": "https://medium.com/@srijansaha.work/why-flies-are-more-efficient-than-autonomous-drones-4d31283cb369"
          }
        ],
        "media": []
      },
      {
        "id": "music",
        "character": "music",
        "eyebrow": "Music",
        "title": "Ten years behind a drum kit",
        "lede": "I've played drums for more than ten years. A drummer's job is to be the steady reference everyone trusts, which is a lot like a control loop.",
        "body": [
          "Leading the Jazzinators taught me the part that isn't playing: calling tunes and keeping a rehearsal together.",
          "The weekend gigs pay for my drone parts."
        ],
        "rosterTitle": "Where I play",
        "roster": [
          {
            "org": "San Jose Youth Symphony Jazz Ensemble",
            "role": "Jazz drummer for three years"
          },
          {
            "org": "SJYS Philharmonic Orchestra",
            "role": "Drummer. Touring Europe next summer"
          },
          {
            "org": "East Bay Traditional Jazz Society Jazzinators",
            "role": "Ensemble leader and longtime senior member"
          },
          {
            "org": "Christ Community Church of Milpitas",
            "role": "Professional church drumming gigs"
          },
          {
            "org": "Downtown Pleasanton",
            "role": "Weekend sets that fund the engineering"
          }
        ],
        "media": []
      },
      {
        "id": "martial-arts",
        "character": "martial",
        "eyebrow": "Martial arts",
        "title": "Black belt, West Coast Martial Arts",
        "lede": "Earning a black belt meant doing the same basics correctly for years.",
        "body": [
          "It taught me to stay with the boring work, which is most of engineering: the fourteenth test flight, not the first."
        ],
        "media": []
      }
    ],
    "musicHighlights": {
      "scholarship": "2× Teagarden Jazz Scholarship winner",
      "earnings": "~$2,000 earned from drums"
    }
  }
};
