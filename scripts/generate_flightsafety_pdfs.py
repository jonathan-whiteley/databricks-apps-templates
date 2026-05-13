#!/usr/bin/env python3
"""
Generate ~27 simulator discrepancy/corrective action PDF documents
and upload them to a Databricks Unity Catalog Volume.
"""

import io
import os
from datetime import datetime, timedelta

from fpdf import FPDF
from databricks.sdk import WorkspaceClient

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

CATALOG = os.environ.get("FLIGHTSAFETY_CATALOG", "flightsafety_demo")
SCHEMA = os.environ.get("FLIGHTSAFETY_SCHEMA", "core")
VOLUME = os.environ.get("FLIGHTSAFETY_VOLUME", "simulator_issue_docs")
VOLUME_PATH = f"/Volumes/{CATALOG}/{SCHEMA}/{VOLUME}"

# ---------------------------------------------------------------------------
# Discrepancy data
# ---------------------------------------------------------------------------

DISCREPANCIES = [
    # -----------------------------------------------------------------------
    # VISUAL SYSTEM (6)
    # -----------------------------------------------------------------------
    {
        "id": "DISC-2025-0023",
        "sim_id": "SIM-003",
        "aircraft": "Boeing 737-800",
        "date_discovered": "2025-01-08",
        "reported_by": "Tech. R. Alvarez",
        "category": "VISUAL SYSTEM DISCREPANCY",
        "description": (
            "During pre-session checks, instructor reported severe display artifacts "
            "manifesting as horizontal banding across the center projector channel. "
            "Artifacts persisted through all lighting modes and became more pronounced "
            "during approach phase simulation. The issue intermittently resolved after "
            "warm-up but returned within 10 minutes of sustained operation."
        ),
        "severity": "Major",
        "troubleshooting_log": [
            ("2025-01-08", "R. Alvarez", "Initial report logged; visual system power-cycled - artifacts persisted."),
            ("2025-01-08", "M. Chen", "Inspected projector DLP chip; verified lamp hours at 1,847 (within limit)."),
            ("2025-01-09", "M. Chen", "Replaced center channel video card; ran thermal stress test - artifacts reduced but not eliminated."),
            ("2025-01-10", "S. Patel", "Traced signal path; discovered loose connector at image generator output. Re-seated and torqued to spec."),
            ("2025-01-10", "S. Patel", "4-hour burn-in test completed - no artifact recurrence observed."),
        ],
        "root_cause": (
            "Intermittent contact failure at the image generator DB-44 output connector caused "
            "signal degradation under thermal expansion, producing banding artifacts on the center "
            "projector channel."
        ),
        "corrective_action": (
            "Re-seated and secured center channel IG output connector; applied thermal-rated "
            "locking compound to connector shell. Ran full visual system acceptance test per "
            "VSC-7 checklist - all channels PASS."
        ),
        "cross_references": [
            ("DISC-2025-0089", "Similar center-channel banding on SIM-007; same connector family."),
        ],
        "verification": (
            "Visual system acceptance test VSC-7 completed 2025-01-10 by S. Patel. "
            "All 5 channels pass color uniformity, edge-blend, and dynamic range checks. "
            "Simulator returned to service 2025-01-11."
        ),
    },
    {
        "id": "DISC-2025-0089",
        "sim_id": "SIM-007",
        "aircraft": "Airbus A320",
        "date_discovered": "2025-03-02",
        "reported_by": "Instr. J. Nakamura",
        "category": "VISUAL SYSTEM DISCREPANCY",
        "description": (
            "Instructor station reported intermittent horizontal banding on the center "
            "projector channel during initial climb segments. The artifact appeared within "
            "15 minutes of powering up the image generator and was reproducible under "
            "sustained high-polygon-density scenes such as urban overfly. Co-pilot side "
            "channel was unaffected."
        ),
        "severity": "Major",
        "troubleshooting_log": [
            ("2025-03-02", "J. Nakamura", "Discrepancy reported; initial power-cycle performed - issue persisted."),
            ("2025-03-03", "K. Williams", "Reviewed DISC-2025-0023 on SIM-003; suspected same connector family fault."),
            ("2025-03-03", "K. Williams", "Inspected DB-44 output connector at IG; found fretting corrosion on pins 7 and 12."),
            ("2025-03-04", "K. Williams", "Replaced connector assembly; applied dielectric grease per maintenance manual sec. 6.4."),
        ],
        "root_cause": (
            "Fretting corrosion on image generator DB-44 output connector pins 7 and 12, "
            "caused by micro-vibration from adjacent motion platform, degraded signal integrity "
            "under thermal load."
        ),
        "corrective_action": (
            "Replaced DB-44 connector assembly on center channel IG output. Applied dielectric "
            "grease and installed vibration-isolating bracket per SIM-007 maintenance manual "
            "sec. 6.4. Full VSC-7 acceptance test performed."
        ),
        "cross_references": [
            ("DISC-2025-0023", "Identical banding symptom on SIM-003; same DB-44 connector root cause."),
        ],
        "verification": (
            "VSC-7 acceptance test completed 2025-03-04 by K. Williams. All channels PASS. "
            "48-hour operational soak performed without recurrence. Returned to service 2025-03-05."
        ),
    },
    {
        "id": "DISC-2025-0031",
        "sim_id": "SIM-012",
        "aircraft": "Boeing 777-200ER",
        "date_discovered": "2025-01-22",
        "reported_by": "Tech. D. Okafor",
        "category": "VISUAL SYSTEM DISCREPANCY",
        "description": (
            "Left-side projector failed to illuminate during system power-up. The projector "
            "lamp status indicator showed amber fault on the visual system controller. "
            "Attempts to cycle the lamp relay through the IOS maintenance panel did not "
            "restore operation."
        ),
        "severity": "Critical",
        "troubleshooting_log": [
            ("2025-01-22", "D. Okafor", "Projector lamp fault confirmed; lamp hours at 2,103 - exceeded 2,000-hour replacement limit."),
            ("2025-01-22", "D. Okafor", "Ordered replacement lamp assembly from OEM; simulator placed OTS."),
            ("2025-01-23", "T. Russo", "Received lamp assembly; installed per VSP-12 procedure. Alignment performed."),
            ("2025-01-23", "T. Russo", "Channel brightness and color calibration completed; edge-blend adjusted."),
        ],
        "root_cause": (
            "Left-side projector lamp exceeded its 2,000-hour service life limit, causing "
            "filament failure. Preventive maintenance tracking system failed to generate "
            "a replacement alert at the 1,800-hour threshold."
        ),
        "corrective_action": (
            "Replaced projector lamp assembly per VSP-12. Recalibrated channel brightness, "
            "color temperature, and edge-blend per VSC-7 section 4. Updated PM tracking "
            "system with correct 1,800-hour alert threshold."
        ),
        "cross_references": [
            ("DISC-2025-0071", "Right-side projector lamp failure on SIM-004 - similar PM tracking gap."),
        ],
        "verification": (
            "Full visual system acceptance test VSC-7 passed 2025-01-23 by T. Russo. "
            "PM tracking alert verified at 1,800 hours. Simulator returned to service 2025-01-24."
        ),
    },
    {
        "id": "DISC-2025-0071",
        "sim_id": "SIM-004",
        "aircraft": "Boeing 737 MAX 8",
        "date_discovered": "2025-02-14",
        "reported_by": "Instr. C. Babatunde",
        "category": "VISUAL SYSTEM DISCREPANCY",
        "description": (
            "Right-side projector displayed a significant brightness drop during night "
            "operations training, reducing scene contrast to an unacceptable level for "
            "low-visibility approach procedures. The center and left channels remained "
            "within calibration tolerances."
        ),
        "severity": "Major",
        "troubleshooting_log": [
            ("2025-02-14", "C. Babatunde", "Brightness fault logged; lamp hours checked - 1,923 hours, approaching limit."),
            ("2025-02-15", "M. Chen", "Photometric measurement: right channel at 68% rated luminance (spec >= 85%)."),
            ("2025-02-15", "M. Chen", "Lamp assembly replaced; alignment and calibration performed."),
        ],
        "root_cause": (
            "Right-side projector lamp degraded below minimum luminance specification at "
            "1,923 hours due to normal end-of-life lumen depreciation. PM tracking alert "
            "was not configured for this projector type."
        ),
        "corrective_action": (
            "Replaced right-side projector lamp assembly. Recalibrated photometric output "
            "and edge-blend per VSC-7. Configured PM alert at 1,800-hour threshold for "
            "all projectors on SIM-004."
        ),
        "cross_references": [
            ("DISC-2025-0031", "Left-side lamp failure on SIM-012 - PM tracking alert gap identified as systemic."),
        ],
        "verification": (
            "Right channel photometric measurement: 97% rated luminance post-repair. "
            "VSC-7 acceptance test PASS 2025-02-15 by M. Chen. Returned to service 2025-02-16."
        ),
    },
    {
        "id": "DISC-2025-0108",
        "sim_id": "SIM-009",
        "aircraft": "Embraer E175",
        "date_discovered": "2025-03-19",
        "reported_by": "Tech. P. Yamamoto",
        "category": "VISUAL SYSTEM DISCREPANCY",
        "description": (
            "Image generator rendering anomaly observed: terrain textures exhibited severe "
            "z-fighting (flickering overlap) on approach to mountainous terrain databases. "
            "The artifact was reproducible with KLAX and KSEA databases but not in oceanic "
            "or flat-terrain scenarios."
        ),
        "severity": "Minor",
        "troubleshooting_log": [
            ("2025-03-19", "P. Yamamoto", "Isolated issue to terrain LOD 2 rendering; elevated terrain databases only."),
            ("2025-03-20", "P. Yamamoto", "Contacted IG OEM; issue tracked to depth buffer precision in software build 4.1.2."),
            ("2025-03-21", "L. Torres", "Applied OEM software patch 4.1.3; terrain z-fighting eliminated in test scenarios."),
        ],
        "root_cause": (
            "Image generator software build 4.1.2 contained a depth buffer precision regression "
            "affecting LOD 2 terrain tiles in high-elevation databases, causing z-fighting "
            "artifacts during approach."
        ),
        "corrective_action": (
            "Applied OEM image generator software patch 4.1.3 which restores depth buffer "
            "precision for LOD 2 terrain rendering. Validated fix with KLAX, KSEA, and KDEN "
            "databases across all lighting conditions."
        ),
        "cross_references": [
            ("DISC-2025-0119", "Same IG software build issue on SIM-011 - patch applied fleet-wide."),
        ],
        "verification": (
            "Terrain rendering validation completed 2025-03-21 by L. Torres using 10 "
            "mountainous approach scenarios. Zero z-fighting artifacts observed. "
            "Simulator returned to service 2025-03-21."
        ),
    },
    {
        "id": "DISC-2025-0119",
        "sim_id": "SIM-011",
        "aircraft": "Airbus A220-300",
        "date_discovered": "2025-03-25",
        "reported_by": "Instr. F. Mensah",
        "category": "VISUAL SYSTEM DISCREPANCY",
        "description": (
            "Instructors reported flickering terrain textures when conducting approaches to "
            "mountainous airports during low-altitude segments below 5,000 ft AGL. The "
            "issue appeared on all three display channels simultaneously, suggesting a "
            "software-level cause rather than hardware. The flickering was absent at "
            "cruise altitudes and during oceanic operations."
        ),
        "severity": "Minor",
        "troubleshooting_log": [
            ("2025-03-25", "F. Mensah", "Discrepancy reported; hardware checks normal - suspected software."),
            ("2025-03-26", "K. Williams", "Cross-referenced DISC-2025-0108 on SIM-009; same IG build 4.1.2 identified."),
            ("2025-03-26", "K. Williams", "Applied OEM patch 4.1.3; full terrain database validation performed."),
        ],
        "root_cause": (
            "Image generator software build 4.1.2 depth buffer precision regression, "
            "identical root cause to DISC-2025-0108 on SIM-009. Fleet-wide patch "
            "deployment confirmed as required."
        ),
        "corrective_action": (
            "Applied OEM patch 4.1.3 to SIM-011 image generator. Conducted validation "
            "with 12 mountainous approach scenarios. Coordinated with fleet maintenance "
            "to ensure patch applied to all affected simulators."
        ),
        "cross_references": [
            ("DISC-2025-0108", "Same IG build 4.1.2 z-fighting issue on SIM-009; source discrepancy."),
        ],
        "verification": (
            "Full terrain rendering validation PASS 2025-03-26 by K. Williams. "
            "All databases tested without artifact recurrence. Returned to service 2025-03-26."
        ),
    },

    # -----------------------------------------------------------------------
    # MOTION PLATFORM (5)
    # -----------------------------------------------------------------------
    {
        "id": "DISC-2025-0045",
        "sim_id": "SIM-003",
        "aircraft": "Boeing 737-800",
        "date_discovered": "2025-01-30",
        "reported_by": "Tech. R. Alvarez",
        "category": "MOTION PLATFORM DISCREPANCY",
        "description": (
            "Motion platform Actuator #4 (right-rear) triggered a hydraulic pressure fault "
            "during high-angle-of-attack recovery maneuver, causing the motion system to "
            "park in the neutral position and halt the training session. The fault occurred "
            "three times within a two-hour window."
        ),
        "severity": "Critical",
        "troubleshooting_log": [
            ("2025-01-30", "R. Alvarez", "Fault code HYD-044 logged; actuator #4 pressure transducer reading 1,850 PSI vs spec 2,200 PSI."),
            ("2025-01-31", "M. Chen", "Inspected hydraulic lines and fittings on actuator #4; found weeping at upper gimbal seal."),
            ("2025-01-31", "M. Chen", "Replaced upper gimbal seal kit; hydraulic fluid topped up per HYD-001 procedure."),
            ("2025-02-01", "S. Patel", "Ran 6-DOF excitation test; actuator #4 pressure stable at 2,210 PSI through full range."),
        ],
        "root_cause": (
            "Upper gimbal seal on Actuator #4 had degraded beyond service limits, causing "
            "hydraulic fluid loss under high-load maneuvers and triggering the low-pressure "
            "fault. Seal inspection interval was overdue by 120 hours."
        ),
        "corrective_action": (
            "Replaced Actuator #4 upper gimbal seal kit per HYD-12 procedure. Topped up "
            "hydraulic fluid and bled the actuator circuit. Reset PM interval for all six "
            "actuator seal inspections to 500-hour limit."
        ),
        "cross_references": [
            ("DISC-2025-0112", "Actuator drift on SIM-004 - hydraulic system family; related maintenance chain."),
            ("DISC-2025-0156", "Washout anomaly on SIM-012 attributed to actuator imbalance post SIM-003 repair."),
        ],
        "verification": (
            "6-DOF excitation test PASS 2025-02-01 by S. Patel. All 6 actuators within "
            "pressure specification across full motion envelope. Platform returned to "
            "service 2025-02-02."
        ),
    },
    {
        "id": "DISC-2025-0112",
        "sim_id": "SIM-004",
        "aircraft": "Boeing 737 MAX 8",
        "date_discovered": "2025-03-22",
        "reported_by": "Instr. C. Babatunde",
        "category": "MOTION PLATFORM DISCREPANCY",
        "description": (
            "Instructor reported noticeable actuator drift during sustained cruise simulation: "
            "the platform slowly migrated approximately 3.2 cm from neutral over a 20-minute "
            "period. The drift was asymmetric, affecting the left-side actuators more than "
            "right-side, causing a perceived roll bias that was flagged by the crew."
        ),
        "severity": "Major",
        "troubleshooting_log": [
            ("2025-03-22", "C. Babatunde", "Drift confirmed via motion system diagnostic; left actuators #1 and #3 showing position error."),
            ("2025-03-23", "T. Russo", "Actuator position sensors calibrated; drift persisted - suspect servo valve."),
            ("2025-03-24", "T. Russo", "Servo valve on actuator #1 replaced; contamination found in valve spool."),
            ("2025-03-24", "D. Okafor", "Hydraulic fluid sampled - particle count elevated at ISO 16/14/11 vs spec 14/12/09."),
            ("2025-03-25", "D. Okafor", "Full hydraulic system flushed and recharged with new fluid; filters replaced."),
        ],
        "root_cause": (
            "Contaminated hydraulic fluid caused particulate buildup in the servo valve spool "
            "of Actuator #1, creating internal leakage and position drift. Fluid contamination "
            "traced to a degraded return-line filter that had exceeded its 1,000-hour service interval."
        ),
        "corrective_action": (
            "Replaced servo valve on Actuator #1. Flushed entire hydraulic circuit and "
            "recharged with clean fluid per HYD-003. Replaced all hydraulic filters. "
            "Calibrated all six actuator position sensors per MPC-6 procedure."
        ),
        "cross_references": [
            ("DISC-2025-0045", "Hydraulic seal fault on SIM-003 - related hydraulic maintenance chain."),
            ("DISC-2025-0156", "Washout anomaly on SIM-012 partially attributed to actuator calibration issues in this family."),
        ],
        "verification": (
            "6-DOF platform excitation test PASS 2025-03-25 by D. Okafor. Position "
            "accuracy within 0.5 mm across all axes. Hydraulic fluid sample ISO 13/11/08 - PASS. "
            "Simulator returned to service 2025-03-26."
        ),
    },
    {
        "id": "DISC-2025-0156",
        "sim_id": "SIM-012",
        "aircraft": "Boeing 777-200ER",
        "date_discovered": "2025-04-10",
        "reported_by": "Tech. D. Okafor",
        "category": "MOTION PLATFORM DISCREPANCY",
        "description": (
            "Motion washout algorithm produced an objectionable low-frequency oscillation "
            "during turbulence simulation. Crews reported a 'rocking chair' sensation that "
            "did not correlate with the turbulence model output. The anomaly was present "
            "in all turbulence intensity settings above 'Light' and was absent with the "
            "motion system disabled."
        ),
        "severity": "Major",
        "troubleshooting_log": [
            ("2025-04-10", "D. Okafor", "Oscillation frequency measured at 0.8 Hz; washout filter cut-off reviewed - parameter mismatch found."),
            ("2025-04-11", "S. Patel", "Cross-referenced recent actuator maintenance on SIM-003 and SIM-004; actuator gain tables suspect."),
            ("2025-04-12", "S. Patel", "Actuator gain tables restored from last validated backup (2025-01-15); oscillation eliminated."),
            ("2025-04-12", "T. Russo", "Full motion tuning sequence performed; washout parameters validated against QTG data."),
        ],
        "root_cause": (
            "Actuator gain table corruption - likely caused by an incomplete parameter "
            "push during the fleet-wide maintenance synchronisation following DISC-2025-0045 "
            "and DISC-2025-0112 repairs - altered the effective washout cut-off frequency, "
            "producing resonance at 0.8 Hz during turbulence inputs."
        ),
        "corrective_action": (
            "Restored actuator gain tables from validated backup dated 2025-01-15. "
            "Re-validated washout filter parameters against approved QTG data set. "
            "Implemented parameter change control procedure requiring dual-technician "
            "sign-off for all gain table modifications."
        ),
        "cross_references": [
            ("DISC-2025-0045", "Hydraulic fault on SIM-003 - maintenance chain that led to parameter synchronisation."),
            ("DISC-2025-0112", "Actuator drift on SIM-004 - part of the same fleet maintenance sequence."),
        ],
        "verification": (
            "QTG validation runs completed 2025-04-12 by T. Russo. Motion time-history "
            "recordings within +/-10% of QTG baseline for all six degrees of freedom. "
            "Simulator returned to service 2025-04-13."
        ),
    },
    {
        "id": "DISC-2025-0062",
        "sim_id": "SIM-006",
        "aircraft": "Airbus A330-300",
        "date_discovered": "2025-02-08",
        "reported_by": "Tech. L. Torres",
        "category": "MOTION PLATFORM DISCREPANCY",
        "description": (
            "Hydraulic Power Unit fault light illuminated during system startup, preventing "
            "motion platform initialisation. HPU pressure failed to reach operating threshold "
            "of 3,000 PSI within the 45-second startup window, causing the motion control "
            "computer to abort the startup sequence."
        ),
        "severity": "Critical",
        "troubleshooting_log": [
            ("2025-02-08", "L. Torres", "HPU fault logged; reservoir level normal; pressure reading at startup: 1,400 PSI peak."),
            ("2025-02-08", "L. Torres", "Checked hydraulic pump drive motor - motor current draw normal; suspect pump internal."),
            ("2025-02-09", "K. Williams", "Hydraulic pump disassembled; vane pump rotor showed significant wear on 3 of 7 vanes."),
            ("2025-02-10", "K. Williams", "Pump assembly replaced; system primed and bled per HYD-002."),
        ],
        "root_cause": (
            "Hydraulic pump vane wear reduced volumetric efficiency below the threshold "
            "required to reach operating pressure within the startup window. Pump had "
            "accumulated 4,200 hours since last overhaul against a 3,500-hour interval."
        ),
        "corrective_action": (
            "Replaced hydraulic pump assembly. Primed and bled system per HYD-002. "
            "Updated PM record to align pump overhaul interval at 3,500 hours. "
            "Conducted full HPU performance test."
        ),
        "cross_references": [],
        "verification": (
            "HPU startup test PASS 2025-02-10: achieved 3,050 PSI within 38 seconds. "
            "6-DOF platform motion check completed without fault. Returned to service 2025-02-11."
        ),
    },
    {
        "id": "DISC-2025-0144",
        "sim_id": "SIM-015",
        "aircraft": "Bombardier CRJ-900",
        "date_discovered": "2025-04-02",
        "reported_by": "Instr. W. Osei",
        "category": "MOTION PLATFORM DISCREPANCY",
        "description": (
            "During rejected take-off training, the motion platform produced an unexpected "
            "lateral jolt at the moment of brake application that was not consistent with "
            "the QTG-validated motion cue. The jolt was repeatable and occurred exclusively "
            "during high-deceleration events, not during normal braking."
        ),
        "severity": "Minor",
        "troubleshooting_log": [
            ("2025-04-02", "W. Osei", "Lateral jolt confirmed in three consecutive RTO runs; motion log shows spike in Y-axis actuator #2."),
            ("2025-04-03", "M. Chen", "Actuator #2 position sensor inspected; mounting bracket found cracked at weld joint."),
            ("2025-04-03", "M. Chen", "Sensor bracket replaced and re-welded; sensor re-calibrated per MPC-6."),
        ],
        "root_cause": (
            "Cracked weld on Actuator #2 position sensor mounting bracket caused sensor "
            "displacement under high lateral acceleration loads, feeding erroneous position "
            "data to the motion control computer and triggering an overcorrection response."
        ),
        "corrective_action": (
            "Replaced and re-welded Actuator #2 position sensor bracket. Recalibrated "
            "sensor per MPC-6. Inspected all remaining actuator sensor brackets for "
            "weld cracking - no additional defects found."
        ),
        "cross_references": [],
        "verification": (
            "RTO maneuver test PASS 2025-04-03 by M. Chen. Five consecutive RTO runs "
            "produced motion cues within QTG tolerance. No spurious lateral jolt detected. "
            "Returned to service 2025-04-04."
        ),
    },

    # -----------------------------------------------------------------------
    # CONTROL LOADING (5)
    # -----------------------------------------------------------------------
    {
        "id": "DISC-2025-0037",
        "sim_id": "SIM-003",
        "aircraft": "Boeing 737-800",
        "date_discovered": "2025-01-24",
        "reported_by": "Instr. A. Leblanc",
        "category": "CONTROL LOADING DISCREPANCY",
        "description": (
            "Pilot-side control column exhibited incorrect force gradient during manual "
            "take-off rotation: stick force required to initiate rotation was approximately "
            "40% higher than the QTG-validated value. The anomaly was consistent across "
            "multiple sessions and affected only the pitch axis; roll forces were normal."
        ),
        "severity": "Major",
        "troubleshooting_log": [
            ("2025-01-24", "A. Leblanc", "Force discrepancy confirmed via hand-held force gauge; pitch axis reads 28 lbs vs 20 lbs spec."),
            ("2025-01-25", "S. Patel", "Control loading software gain checked - nominal; inspected pitch actuator mechanical linkage."),
            ("2025-01-25", "S. Patel", "Found excessive friction in pitch axis universal joint - joint bearings dry."),
            ("2025-01-26", "R. Alvarez", "Re-lubricated pitch axis U-joint per CLS-08 lubrication schedule; forces re-measured."),
        ],
        "root_cause": (
            "Pitch axis universal joint bearings were insufficiently lubricated, causing "
            "stiction that artificially elevated the measured stick force gradient. "
            "Lubrication interval had not been performed at the scheduled 500-hour interval."
        ),
        "corrective_action": (
            "Re-lubricated pitch axis universal joint per CLS-08 lubrication schedule using "
            "Mobil SHC 100 grease. Verified pitch axis force gradient at three airspeed "
            "breakpoints against QTG data - all within +/-5% tolerance."
        ),
        "cross_references": [
            ("DISC-2025-0094", "Similar pitch force discrepancy on SIM-007; same lubrication root cause."),
        ],
        "verification": (
            "Force gradient validation PASS 2025-01-26 by R. Alvarez. Pitch axis: Vr=132 kts "
            "measured 20.1 lbs (spec 20 +/-2 lbs). Lubrication PM interval reset to 500 hours. "
            "Returned to service 2025-01-27."
        ),
    },
    {
        "id": "DISC-2025-0094",
        "sim_id": "SIM-007",
        "aircraft": "Airbus A320",
        "date_discovered": "2025-03-05",
        "reported_by": "Tech. K. Williams",
        "category": "CONTROL LOADING DISCREPANCY",
        "description": (
            "Sidestick force feedback on captain's side showed anomalous stiffness during "
            "simulated crosswind landing approaches. Instructors noted that trainees "
            "required significantly more force input than expected to maintain heading "
            "corrections below 50 kt groundspeed, suggesting a force trim offset."
        ),
        "severity": "Major",
        "troubleshooting_log": [
            ("2025-03-05", "K. Williams", "Sidestick force measured: lateral axis 14.2 N vs spec 9.5 N at zero displacement."),
            ("2025-03-06", "K. Williams", "Reviewed DISC-2025-0037 on SIM-003; inspected lateral axis pivot bearings."),
            ("2025-03-06", "L. Torres", "Lateral axis pivot bearings found corroded; bearing assembly replaced."),
            ("2025-03-07", "L. Torres", "Force calibration performed per CLS-09; all axes within spec."),
        ],
        "root_cause": (
            "Corrosion on lateral axis pivot bearings of captain's sidestick increased "
            "friction torque, causing elevated residual force at zero displacement. "
            "Corrosion was attributed to humidity intrusion during a facility HVAC outage."
        ),
        "corrective_action": (
            "Replaced corroded lateral axis pivot bearing assembly. Applied corrosion "
            "inhibitor coating per maintenance manual sec. 9.2. Performed full sidestick "
            "force calibration per CLS-09 across all displacement and airspeed breakpoints."
        ),
        "cross_references": [
            ("DISC-2025-0037", "Pitch axis force discrepancy on SIM-003 - bearing/lubrication root cause family."),
        ],
        "verification": (
            "CLS-09 force calibration PASS 2025-03-07 by L. Torres. Lateral axis: 9.3 N at "
            "zero displacement (spec 9.5 +/-1.0 N). All sidestick axes within QTG tolerance. "
            "Returned to service 2025-03-08."
        ),
    },
    {
        "id": "DISC-2025-0053",
        "sim_id": "SIM-004",
        "aircraft": "Boeing 737 MAX 8",
        "date_discovered": "2025-02-03",
        "reported_by": "Instr. C. Babatunde",
        "category": "CONTROL LOADING DISCREPANCY",
        "description": (
            "Electric pitch trim runaway scenario was initiated from the IOS, but the "
            "trim wheel did not stop rotating when STAB TRIM CUTOUT switches were activated. "
            "The runaway continued for approximately 3 seconds after cutout, which does not "
            "match the certified training scenario behaviour."
        ),
        "severity": "Critical",
        "troubleshooting_log": [
            ("2025-02-03", "C. Babatunde", "Trim cutout failure confirmed in three consecutive tests; cutout relay response time logged."),
            ("2025-02-04", "T. Russo", "Control loading software relay interface tested; relay coil resistance out of spec (850 Ohm vs 600 Ohm)."),
            ("2025-02-04", "T. Russo", "Cutout relay replaced; interface tested - relay actuation time 18 ms (spec <= 25 ms)."),
            ("2025-02-05", "D. Okafor", "Ten consecutive trim runaway scenarios run; cutout functioned correctly in all cases."),
        ],
        "root_cause": (
            "Degraded cutout relay coil resistance increased actuation time beyond the threshold "
            "required to halt the trim motor model within the certified scenario time window. "
            "The relay was original equipment and had not been included in the periodic "
            "relay replacement schedule."
        ),
        "corrective_action": (
            "Replaced pitch trim cutout relay with OEM-specified component. Added relay "
            "to 2,000-hour replacement PM schedule. Validated trim runaway scenario per "
            "AQP training certification requirements."
        ),
        "cross_references": [],
        "verification": (
            "Ten trim runaway scenarios conducted 2025-02-05 by D. Okafor. Cutout response "
            "in all cases <= 0.5 seconds from switch activation (spec <= 1.0 s). "
            "Scenario recertified. Returned to service 2025-02-06."
        ),
    },
    {
        "id": "DISC-2025-0101",
        "sim_id": "SIM-008",
        "aircraft": "Airbus A350-900",
        "date_discovered": "2025-03-12",
        "reported_by": "Tech. P. Yamamoto",
        "category": "CONTROL LOADING DISCREPANCY",
        "description": (
            "Rudder pedal force-displacement characteristic showed a dead band of approximately "
            "15 mm at center that was not present in the approved QTG data. Instructors "
            "reported that trainees were over-controlling on the rudder during crosswind "
            "training due to the unexpected unresponsive zone."
        ),
        "severity": "Minor",
        "troubleshooting_log": [
            ("2025-03-12", "P. Yamamoto", "Dead band measured at 14.7 mm (spec <= 3 mm); rudder pedal centering spring inspected."),
            ("2025-03-13", "P. Yamamoto", "Centering spring preload found reduced - spring had partially uncoiled from seat."),
            ("2025-03-13", "M. Chen", "Centering spring re-seated and preload adjusted per CLS-11 specification (22 N.m)."),
        ],
        "root_cause": (
            "Rudder pedal centering spring lost preload due to the spring uncoiling from "
            "its retaining seat, reducing the restoring force at center and creating an "
            "effective dead band beyond QTG tolerances."
        ),
        "corrective_action": (
            "Re-seated rudder pedal centering spring and adjusted preload to 22 N.m per "
            "CLS-11. Performed dead band measurement: 1.8 mm (spec <= 3 mm). Conducted "
            "full rudder axis force-displacement calibration."
        ),
        "cross_references": [],
        "verification": (
            "Rudder force-displacement PASS 2025-03-13 by M. Chen. Dead band 1.8 mm, "
            "maximum rudder force 78.5 N (spec 80 +/-5 N). All breakpoints within QTG tolerance. "
            "Returned to service 2025-03-14."
        ),
    },
    {
        "id": "DISC-2025-0129",
        "sim_id": "SIM-012",
        "aircraft": "Boeing 777-200ER",
        "date_discovered": "2025-03-30",
        "reported_by": "Tech. D. Okafor",
        "category": "CONTROL LOADING DISCREPANCY",
        "description": (
            "Control wheel steering mode produced incorrect feel force when transitioning "
            "from autopilot to manual control: the handover transient force spike reached "
            "38 lbs on the column, significantly above the certified 25-lb maximum. "
            "The spike was consistent across multiple autopilot disconnect events."
        ),
        "severity": "Major",
        "troubleshooting_log": [
            ("2025-03-30", "D. Okafor", "Force spike measured at 38.4 lbs peak during disconnect (spec <= 25 lbs)."),
            ("2025-03-31", "S. Patel", "Control loading software transition rate parameter reviewed; value set to 0.8 s (spec 1.5 s)."),
            ("2025-03-31", "S. Patel", "Transition rate corrected to 1.5 s; spike measured at 22.1 lbs - within spec."),
        ],
        "root_cause": (
            "Control loading software autopilot disconnect transition rate parameter was "
            "incorrectly set to 0.8 seconds instead of the certified 1.5 seconds, causing "
            "an excessively rapid force ramp-up that produced the spike transient."
        ),
        "corrective_action": (
            "Corrected autopilot disconnect transition rate parameter from 0.8 s to 1.5 s "
            "in control loading software configuration file CLS-CONFIG-SIM012-V3. "
            "Verified parameter against master configuration document."
        ),
        "cross_references": [
            ("DISC-2025-0156", "SIM-012 parameter integrity - same configuration management gap."),
        ],
        "verification": (
            "Autopilot disconnect force spike test PASS 2025-03-31 by S. Patel. "
            "Peak transient 22.1 lbs (spec <= 25 lbs) across 10 disconnect events. "
            "Returned to service 2025-04-01."
        ),
    },

    # -----------------------------------------------------------------------
    # AVIONICS / INSTRUMENTS (4)
    # -----------------------------------------------------------------------
    {
        "id": "DISC-2025-0019",
        "sim_id": "SIM-002",
        "aircraft": "Boeing 737-800",
        "date_discovered": "2025-01-05",
        "reported_by": "Instr. J. Nakamura",
        "category": "AVIONICS / INSTRUMENTS DISCREPANCY",
        "description": (
            "FMC legs page displayed an 'UNABLE RNP' message during a published RNP AR "
            "approach procedure despite correct aircraft performance entry. The condition "
            "prevented crews from executing the approach and was not replicable with the "
            "FMC database from the previous AIRAC cycle."
        ),
        "severity": "Major",
        "troubleshooting_log": [
            ("2025-01-05", "J. Nakamura", "UNABLE RNP confirmed on three consecutive approach attempts; FMC version 10.3a noted."),
            ("2025-01-06", "T. Russo", "Contacted OEM; identified FMC software bug in version 10.3a affecting RNP AR procedures with RF legs."),
            ("2025-01-07", "T. Russo", "Applied FMC software update 10.3b; RNP AR approach tested successfully."),
        ],
        "root_cause": (
            "FMC software version 10.3a contained a bug in the RF (radius-to-fix) leg "
            "path computation routine that incorrectly calculated RNP capability for "
            "approaches requiring bank angles above 25 degrees, triggering a false "
            "'UNABLE RNP' annunciation."
        ),
        "corrective_action": (
            "Updated FMC software to version 10.3b per OEM service bulletin SB-FMC-2025-003. "
            "Validated five RNP AR approach procedures including RF legs with bank angles "
            "up to 30 degrees - all executed without UNABLE RNP."
        ),
        "cross_references": [],
        "verification": (
            "RNP AR validation PASS 2025-01-07 by T. Russo. Approaches RNAV(RNP) Y "
            "KDCA, RNAV(RNP) Z KSBP, and three others completed without FMC fault. "
            "Returned to service 2025-01-08."
        ),
    },
    {
        "id": "DISC-2025-0058",
        "sim_id": "SIM-005",
        "aircraft": "Airbus A320",
        "date_discovered": "2025-02-06",
        "reported_by": "Tech. L. Torres",
        "category": "AVIONICS / INSTRUMENTS DISCREPANCY",
        "description": (
            "Primary Flight Display on captain's side froze and displayed the last valid "
            "frame for approximately 8 seconds before recovering. The freeze occurred "
            "during a rapid configuration change from flaps 1 to flaps 3 at approach speed. "
            "The event was logged by the avionics simulation host and was repeatable."
        ),
        "severity": "Critical",
        "troubleshooting_log": [
            ("2025-02-06", "L. Torres", "PFD freeze event logged; avionics host CPU utilisation at freeze: 98%."),
            ("2025-02-07", "K. Williams", "Profiled avionics host during flap change; aerodynamic model recalculation identified as CPU spike source."),
            ("2025-02-08", "K. Williams", "Avionics simulation software updated to version 5.7; aerodynamic update threading reworked."),
            ("2025-02-08", "L. Torres", "Freeze test repeated 20 times with various configuration changes - no recurrence."),
        ],
        "root_cause": (
            "Avionics simulation software version 5.6 performed aerodynamic model recalculations "
            "synchronously on the display render thread, causing CPU saturation during "
            "complex configuration changes and freezing the PFD frame buffer."
        ),
        "corrective_action": (
            "Updated avionics simulation software to version 5.7, which offloads aerodynamic "
            "model recalculations to a separate thread. Verified PFD frame rate stability "
            "during all standard configuration change sequences."
        ),
        "cross_references": [],
        "verification": (
            "PFD stability test PASS 2025-02-08 by L. Torres. 20 configuration change "
            "sequences performed; zero freeze events. CPU utilisation peak 67%. "
            "Returned to service 2025-02-09."
        ),
    },
    {
        "id": "DISC-2025-0082",
        "sim_id": "SIM-003",
        "aircraft": "Boeing 737-800",
        "date_discovered": "2025-02-25",
        "reported_by": "Instr. A. Leblanc",
        "category": "AVIONICS / INSTRUMENTS DISCREPANCY",
        "description": (
            "TCAS II resolution advisory failed to trigger during a converging traffic "
            "scenario that was set up from the IOS. The RA should have annunciated "
            "'CLIMB CLIMB CLIMB' at 35 seconds before CPA; instead no RA was issued "
            "and the traffic advisory cleared normally at 0.3 nm. The scenario had "
            "been working correctly in the previous training session."
        ),
        "severity": "Critical",
        "troubleshooting_log": [
            ("2025-02-25", "A. Leblanc", "RA failure confirmed; TCAS host log shows no RA logic execution for the threat aircraft."),
            ("2025-02-26", "S. Patel", "IOS scenario file inspected; intruder altitude rate set to 0 fpm - intended value 2,500 fpm."),
            ("2025-02-26", "S. Patel", "Scenario file corrected and saved; TCAS RA generated correctly in retest."),
        ],
        "root_cause": (
            "The IOS training scenario file was incorrectly saved with the intruder aircraft "
            "altitude rate parameter set to 0 fpm instead of the intended 2,500 fpm. With "
            "zero rate of closure in the vertical plane, the TCAS threat logic correctly "
            "determined no RA was necessary."
        ),
        "corrective_action": (
            "Corrected intruder altitude rate parameter in scenario file TS-TCAS-RNV-003.scn "
            "from 0 fpm to 2,500 fpm. Implemented scenario file validation check in IOS "
            "that flags zero-rate intruders in TCAS test scenarios."
        ),
        "cross_references": [],
        "verification": (
            "TCAS RA scenario retest PASS 2025-02-26 by S. Patel. RA 'CLIMB CLIMB CLIMB' "
            "issued at 37 seconds before CPA in five consecutive runs. Returned to service 2025-02-27."
        ),
    },
    {
        "id": "DISC-2025-0133",
        "sim_id": "SIM-014",
        "aircraft": "Embraer E190",
        "date_discovered": "2025-04-01",
        "reported_by": "Tech. F. Mensah",
        "category": "AVIONICS / INSTRUMENTS DISCREPANCY",
        "description": (
            "EICAS engine display showed N1 indication frozen at last value when simulated "
            "engine failure was induced via IOS. The frozen indication persisted for the "
            "remainder of the session and did not recover after engine restart simulation. "
            "Instructors were unable to verify engine-out procedures using the affected display."
        ),
        "severity": "Major",
        "troubleshooting_log": [
            ("2025-04-01", "F. Mensah", "N1 freeze confirmed on engine 2 channel; propulsion model was generating correct data."),
            ("2025-04-02", "W. Osei", "Traced data path; ARINC 429 bus interface card for engine 2 EICAS channel found unresponsive."),
            ("2025-04-02", "W. Osei", "ARINC 429 interface card replaced; EICAS N1 display responding correctly."),
        ],
        "root_cause": (
            "Faulty ARINC 429 bus interface card on the Engine 2 EICAS channel lost "
            "communication with the propulsion simulation host, causing the display to "
            "hold its last valid value. The card failure was confirmed by diagnostic "
            "loopback test."
        ),
        "corrective_action": (
            "Replaced Engine 2 EICAS ARINC 429 bus interface card. Performed ARINC 429 "
            "loopback test on all engine indication channels. Validated engine failure "
            "indication sequence per training scenario EICAS-001."
        ),
        "cross_references": [],
        "verification": (
            "Engine failure indication test PASS 2025-04-02 by W. Osei. Engine 2 N1, "
            "N2, EGT, FF all respond correctly to failure induction in five scenarios. "
            "Returned to service 2025-04-03."
        ),
    },

    # -----------------------------------------------------------------------
    # INSTRUCTOR STATION (4)
    # -----------------------------------------------------------------------
    {
        "id": "DISC-2025-0026",
        "sim_id": "SIM-001",
        "aircraft": "Boeing 737-800",
        "date_discovered": "2025-01-14",
        "reported_by": "Instr. J. Nakamura",
        "category": "INSTRUCTOR OPERATING STATION DISCREPANCY",
        "description": (
            "IOS application crashed with an unhandled exception during attempt to load "
            "a custom weather scenario. The crash was reproducible when loading any scenario "
            "file with embedded SIGMET polygon data. Standard weather presets loaded "
            "without issue."
        ),
        "severity": "Critical",
        "troubleshooting_log": [
            ("2025-01-14", "J. Nakamura", "Crash logs reviewed; null pointer exception in weather polygon parser at line 847."),
            ("2025-01-15", "T. Russo", "Issue traced to IOS software version 3.2.1; OEM notified."),
            ("2025-01-16", "T. Russo", "OEM hotfix 3.2.1-HF2 applied; SIGMET polygon parsing validated with 15 scenario files."),
        ],
        "root_cause": (
            "IOS software version 3.2.1 weather polygon parser did not handle SIGMET polygons "
            "with more than 8 vertices, throwing a null pointer exception when the vertex "
            "array was exceeded. The bug was introduced in the 3.2.0 weather engine update."
        ),
        "corrective_action": (
            "Applied OEM IOS hotfix 3.2.1-HF2 which increases the maximum SIGMET polygon "
            "vertex limit to 32 and adds bounds checking. Validated loading of all 15 "
            "custom weather scenarios in the training library."
        ),
        "cross_references": [
            ("DISC-2025-0077", "IOS crash on SIM-006 - same software version, different trigger condition."),
        ],
        "verification": (
            "All 15 custom weather scenarios loaded without crash 2025-01-16 by T. Russo. "
            "SIGMET polygons with up to 32 vertices validated. Returned to service 2025-01-17."
        ),
    },
    {
        "id": "DISC-2025-0077",
        "sim_id": "SIM-006",
        "aircraft": "Airbus A330-300",
        "date_discovered": "2025-02-18",
        "reported_by": "Tech. L. Torres",
        "category": "INSTRUCTOR OPERATING STATION DISCREPANCY",
        "description": (
            "IOS application crashed during multi-engine failure scenario when the instructor "
            "attempted to activate both engine failure malfunctions simultaneously from the "
            "malfunction panel. Single-engine failures functioned correctly. The crash "
            "produced a recoverable exception but reset the simulation to initial conditions."
        ),
        "severity": "Major",
        "troubleshooting_log": [
            ("2025-02-18", "L. Torres", "Crash log shows race condition in malfunction dispatch queue when two malfunctions fire simultaneously."),
            ("2025-02-19", "K. Williams", "OEM notified; issue confirmed as known defect in IOS version 3.2.1 malfunction dispatcher."),
            ("2025-02-20", "K. Williams", "OEM patch 3.2.2 applied; serializes simultaneous malfunction activation with 50 ms offset."),
        ],
        "root_cause": (
            "IOS version 3.2.1 malfunction dispatcher contained a race condition when "
            "two malfunctions were activated simultaneously within a single UI event loop "
            "cycle, causing a state corruption in the propulsion model interface."
        ),
        "corrective_action": (
            "Applied IOS software update 3.2.2 which serialises simultaneous malfunction "
            "activations using a 50 ms dispatch offset. Validated all multi-malfunction "
            "training scenarios from the approved training syllabus."
        ),
        "cross_references": [
            ("DISC-2025-0026", "IOS crash on SIM-001 - same software version 3.2.1, related software quality issue."),
        ],
        "verification": (
            "Multi-malfunction scenario test PASS 2025-02-20 by K. Williams. "
            "Twelve dual-malfunction combinations executed without crash. Returned to service 2025-02-21."
        ),
    },
    {
        "id": "DISC-2025-0096",
        "sim_id": "SIM-010",
        "aircraft": "Boeing 777-200ER",
        "date_discovered": "2025-03-08",
        "reported_by": "Instr. A. Leblanc",
        "category": "INSTRUCTOR OPERATING STATION DISCREPANCY",
        "description": (
            "Scenario auto-save feature failed to write progress to disk during a 4-hour "
            "LOFT session. When the instructor attempted to restore the scenario at a "
            "mid-session checkpoint, the restore operation failed and the session had to "
            "be restarted from the beginning, losing 2 hours of training data."
        ),
        "severity": "Major",
        "troubleshooting_log": [
            ("2025-03-08", "A. Leblanc", "Auto-save log reviewed; disk write errors recorded every 15 minutes - auto-save directory full."),
            ("2025-03-09", "P. Yamamoto", "IOS disk partition checked; /sim/scenarios partition at 99.7% capacity."),
            ("2025-03-09", "P. Yamamoto", "Deleted archived scenarios older than 180 days; partition cleared to 61% capacity."),
            ("2025-03-09", "P. Yamamoto", "Configured disk space alert at 80% threshold; auto-save validated."),
        ],
        "root_cause": (
            "IOS scenario storage partition reached capacity due to accumulation of archived "
            "scenario files over 14 months without any housekeeping. No disk space monitoring "
            "or alerting had been configured, so the condition was not detected before impact."
        ),
        "corrective_action": (
            "Deleted scenario archive files older than 180 days. Configured automated disk "
            "space monitoring with alert at 80% threshold. Implemented quarterly housekeeping "
            "procedure in IOS maintenance schedule."
        ),
        "cross_references": [],
        "verification": (
            "Auto-save test PASS 2025-03-09 by P. Yamamoto. Ten consecutive save/restore "
            "cycles completed without error. Disk alert threshold tested and confirmed "
            "active. Returned to service 2025-03-10."
        ),
    },
    {
        "id": "DISC-2025-0148",
        "sim_id": "SIM-013",
        "aircraft": "Airbus A220-300",
        "date_discovered": "2025-04-07",
        "reported_by": "Tech. F. Mensah",
        "category": "INSTRUCTOR OPERATING STATION DISCREPANCY",
        "description": (
            "IOS scenario-load time increased from the expected 45 seconds to over 8 minutes "
            "for any scenario using the updated AIRAC cycle database. Instructors reported "
            "the delay was operationally unacceptable and occasionally caused the IOS "
            "session controller to timeout and abort the load."
        ),
        "severity": "Major",
        "troubleshooting_log": [
            ("2025-04-07", "F. Mensah", "Load time profiled; database parsing module consuming 7.5 minutes of the 8-minute total."),
            ("2025-04-08", "W. Osei", "New AIRAC database file found to be 4.2 GB vs previous 1.1 GB - redundant waypoint records identified."),
            ("2025-04-08", "W. Osei", "Contacted database supplier; received corrected database file 1.3 GB; load time 48 seconds."),
        ],
        "root_cause": (
            "The AIRAC cycle database received from the navigation data supplier contained "
            "duplicate waypoint records that increased file size to 4.2 GB, causing the "
            "IOS parsing module to process approximately 3x the expected data volume on "
            "every scenario load."
        ),
        "corrective_action": (
            "Replaced corrupted AIRAC database with corrected file from supplier. "
            "Implemented database file size validation script to flag anomalous file "
            "sizes before installation. Validated scenario load time with five scenarios."
        ),
        "cross_references": [],
        "verification": (
            "Scenario load time PASS 2025-04-08 by W. Osei. Five scenarios loaded in "
            "45-52 seconds (spec <= 90 seconds). Database size validation script tested "
            "and active. Returned to service 2025-04-09."
        ),
    },

    # -----------------------------------------------------------------------
    # ENVIRONMENTAL (3)
    # -----------------------------------------------------------------------
    {
        "id": "DISC-2025-0041",
        "sim_id": "SIM-003",
        "aircraft": "Boeing 737-800",
        "date_discovered": "2025-01-27",
        "reported_by": "Instr. A. Leblanc",
        "category": "ENVIRONMENTAL SYSTEMS DISCREPANCY",
        "description": (
            "Spatial audio system failed to reproduce engine sound during simulated single-engine "
            "operations: when engine 2 was failed from the IOS, the audio continued to play "
            "both engines at normal volume. The sound cue failure removed an important training "
            "element for engine failure recognition training."
        ),
        "severity": "Major",
        "troubleshooting_log": [
            ("2025-01-27", "A. Leblanc", "Audio fault confirmed; sound model log shows engine 2 channel active despite malfunction command."),
            ("2025-01-28", "R. Alvarez", "Inspected malfunction-to-audio bridge software interface; event handler for ENGINE_FAIL was missing subscription."),
            ("2025-01-29", "R. Alvarez", "Audio bridge software patched to subscribe to ENGINE_FAIL malfunction events; engine sound validated."),
        ],
        "root_cause": (
            "The audio simulation bridge software was missing an event subscription for the "
            "ENGINE_FAIL malfunction event ID, which had been renamed from ENGINE_SHUTDOWN "
            "in IOS software version 3.2.1. The rename broke the audio model's engine "
            "failure response without triggering any runtime error."
        ),
        "corrective_action": (
            "Updated audio bridge software event subscription from deprecated ENGINE_SHUTDOWN "
            "to current ENGINE_FAIL event ID per IOS API changelog. Validated all engine "
            "sound scenarios including single-engine taxi, takeoff, and approach."
        ),
        "cross_references": [
            ("DISC-2025-0026", "IOS version 3.2.1 API changes - related event naming impact."),
        ],
        "verification": (
            "Engine sound scenario test PASS 2025-01-29 by R. Alvarez. Engine 2 sound "
            "correctly mutes within 0.5 seconds of ENGINE_FAIL event in ten consecutive "
            "tests. Returned to service 2025-01-30."
        ),
    },
    {
        "id": "DISC-2025-0067",
        "sim_id": "SIM-004",
        "aircraft": "Boeing 737 MAX 8",
        "date_discovered": "2025-02-12",
        "reported_by": "Tech. D. Okafor",
        "category": "ENVIRONMENTAL SYSTEMS DISCREPANCY",
        "description": (
            "Simulator cab lighting controller failed to execute cockpit lighting transitions "
            "for the night/day environment changeover scenario. All cockpit panels remained "
            "at full brightness regardless of the selected environment illumination setting "
            "from the IOS. Emergency exit lighting was unaffected."
        ),
        "severity": "Minor",
        "troubleshooting_log": [
            ("2025-02-12", "D. Okafor", "Lighting controller DMX output verified normal at controller output; suspect cab relay panel."),
            ("2025-02-13", "T. Russo", "Cab lighting relay panel inspected; relay K-12 (main dimmer bus) found failed open."),
            ("2025-02-13", "T. Russo", "Relay K-12 replaced; all lighting zones tested across full dimmer range."),
        ],
        "root_cause": (
            "Relay K-12 on the cab lighting relay panel failed in the open position, "
            "disconnecting the main dimmer bus from the cockpit panel lighting circuits. "
            "Emergency lighting was on a separate circuit and therefore unaffected. "
            "Relay had accumulated 6,400 hours with no replacement."
        ),
        "corrective_action": (
            "Replaced relay K-12 with rated component. Added all cab lighting relays to "
            "4,000-hour preventive replacement schedule. Tested all cockpit lighting zones "
            "from 0% to 100% dimmer range per ENV-07 checklist."
        ),
        "cross_references": [],
        "verification": (
            "ENV-07 lighting acceptance test PASS 2025-02-13 by T. Russo. All 14 lighting "
            "zones respond across full dimmer range. Night transition time 3.2 seconds (spec <= 5 s). "
            "Returned to service 2025-02-14."
        ),
    },
    {
        "id": "DISC-2025-0116",
        "sim_id": "SIM-016",
        "aircraft": "Bombardier CRJ-900",
        "date_discovered": "2025-03-24",
        "reported_by": "Instr. W. Osei",
        "category": "ENVIRONMENTAL SYSTEMS DISCREPANCY",
        "description": (
            "Rain simulation system (rain effect on windshield) failed to activate when "
            "precipitation was selected from the IOS weather panel. The wiper simulation "
            "operated correctly, and visual rain particles were rendering in the external "
            "scene, but the windshield precipitation effect texture was absent."
        ),
        "severity": "Minor",
        "troubleshooting_log": [
            ("2025-03-24", "W. Osei", "Windshield precipitation shader confirmed inactive; IOS weather state verified as sending rain command."),
            ("2025-03-25", "P. Yamamoto", "Image generator graphics driver updated to version 512.3; previous version known to corrupt windshield shader."),
            ("2025-03-25", "P. Yamamoto", "Precipitation effect confirmed active after driver update; visual quality verified."),
        ],
        "root_cause": (
            "Image generator graphics driver version 511.9 corrupted the windshield "
            "precipitation shader binary during a driver update, causing the shader "
            "to silently fail to execute without producing a render error. The wiper "
            "animation and scene precipitation used different shaders and were unaffected."
        ),
        "corrective_action": (
            "Updated IG graphics driver to version 512.3 which includes a fix for the "
            "windshield shader compilation issue. Validated precipitation effect across "
            "light rain, moderate rain, and heavy rain settings at day and night."
        ),
        "cross_references": [],
        "verification": (
            "Precipitation effect validation PASS 2025-03-25 by P. Yamamoto. All three "
            "intensity levels and both lighting conditions confirmed. Wiper interaction "
            "with precipitation effect validated. Returned to service 2025-03-26."
        ),
    },
]


# ---------------------------------------------------------------------------
# PDF generation
# ---------------------------------------------------------------------------

class DiscrepancyPDF(FPDF):
    """Custom FPDF subclass for simulator discrepancy reports."""

    COLORS = {
        "header_bg": (30, 60, 114),       # Dark blue header
        "header_text": (255, 255, 255),
        "section_bg": (220, 230, 242),    # Light blue section background
        "critical": (200, 30, 30),
        "major": (200, 120, 0),
        "minor": (30, 130, 30),
        "table_header_bg": (70, 100, 160),
        "table_row_alt": (240, 244, 250),
        "line": (150, 170, 200),
        "body_text": (30, 30, 30),
    }

    def header(self):
        # Thin top bar
        self.set_fill_color(*self.COLORS["header_bg"])
        self.rect(0, 0, 210, 18, "F")
        self.set_y(3)
        self.set_text_color(*self.COLORS["header_text"])
        self.set_font("Helvetica", "B", 11)
        self.cell(0, 7, "FLIGHT SAFETY INTERNATIONAL - SIMULATOR MAINTENANCE SYSTEM", align="C", new_x="LMARGIN", new_y="NEXT")
        self.set_font("Helvetica", "", 8)
        self.cell(0, 5, "DISCREPANCY & CORRECTIVE ACTION REPORT", align="C", new_x="LMARGIN", new_y="NEXT")
        self.set_text_color(*self.COLORS["body_text"])
        self.ln(4)

    def footer(self):
        self.set_y(-14)
        self.set_font("Helvetica", "I", 7)
        self.set_text_color(120, 120, 120)
        self.cell(0, 5, f"PROPRIETARY - FOR INTERNAL MAINTENANCE USE ONLY    Page {self.page_no()}", align="C")

    # ------------------------------------------------------------------
    def section_heading(self, title: str):
        self.set_fill_color(*self.COLORS["section_bg"])
        self.set_text_color(*self.COLORS["header_bg"])
        self.set_font("Helvetica", "B", 9)
        self.cell(0, 7, f"  {title}", ln=True, fill=True)
        self.set_text_color(*self.COLORS["body_text"])
        self.ln(1)

    def body_text(self, text: str):
        self.set_font("Helvetica", "", 9)
        self.multi_cell(0, 5, text)
        self.ln(2)

    def label_value(self, label: str, value: str):
        self.set_font("Helvetica", "B", 9)
        self.cell(48, 5, label + ":", ln=False)
        self.set_font("Helvetica", "", 9)
        self.multi_cell(0, 5, value)

    def severity_badge(self, severity: str):
        color_map = {
            "Critical": self.COLORS["critical"],
            "Major": self.COLORS["major"],
            "Minor": self.COLORS["minor"],
        }
        color = color_map.get(severity, (80, 80, 80))
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(*self.COLORS["header_text"])
        self.set_fill_color(*color)
        self.cell(30, 6, f" {severity.upper()} ", fill=True)
        self.set_fill_color(255, 255, 255)
        self.set_text_color(*self.COLORS["body_text"])
        self.ln(8)

    def troubleshooting_table(self, log_entries: list):
        col_widths = [30, 36, 124]
        headers = ["Date", "Technician", "Action Taken"]

        # Header row
        self.set_fill_color(*self.COLORS["table_header_bg"])
        self.set_text_color(*self.COLORS["header_text"])
        self.set_font("Helvetica", "B", 8)
        for w, h in zip(col_widths, headers):
            self.cell(w, 6, f"  {h}", border=0, fill=True)
        self.ln()
        self.set_text_color(*self.COLORS["body_text"])

        # Data rows - use cell-based rendering to avoid horizontal space issues
        # Action text is split into chunks that fit the column width (~95 chars)
        for i, (date, tech, action) in enumerate(log_entries):
            fill = i % 2 == 1
            self.set_fill_color(*self.COLORS["table_row_alt"])
            self.set_font("Helvetica", "", 8)

            # Split action into lines of ~95 characters to fit col_widths[2]=124mm at 8pt
            max_chars = 95
            words = action.split(" ")
            action_lines = []
            current = ""
            for word in words:
                if len(current) + len(word) + 1 <= max_chars:
                    current = (current + " " + word).strip()
                else:
                    if current:
                        action_lines.append(current)
                    current = word
            if current:
                action_lines.append(current)
            if not action_lines:
                action_lines = [""]

            row_h = 5
            total_h = len(action_lines) * row_h

            x_start = self.l_margin
            y_start = self.get_y()

            # Draw date and tech cells spanning full height
            self.set_xy(x_start, y_start)
            self.cell(col_widths[0], total_h, f"  {date}", border="B", fill=fill)
            self.cell(col_widths[1], total_h, f"  {tech}", border="B", fill=fill)

            # Draw action lines stacked
            x_action = x_start + col_widths[0] + col_widths[1]
            for j, line in enumerate(action_lines):
                self.set_xy(x_action, y_start + j * row_h)
                is_last = (j == len(action_lines) - 1)
                self.cell(col_widths[2], row_h, f"  {line}",
                          border="B" if is_last else 0, fill=fill)

            self.set_xy(x_start, y_start + total_h)

        self.ln(3)

    def cross_ref_list(self, refs: list):
        if not refs:
            self.set_font("Helvetica", "I", 9)
            self.cell(0, 5, "No cross-references for this discrepancy.",
                      new_x="LMARGIN", new_y="NEXT")
            self.ln(1)
            return
        for disc_id, description in refs:
            self.set_font("Helvetica", "B", 9)
            self.cell(40, 5, disc_id, new_x="RIGHT", new_y="TOP")
            self.set_font("Helvetica", "", 9)
            # Use remaining width explicitly to avoid multi_cell width=0 issue
            remaining = self.epw - 40
            self.multi_cell(remaining, 5, description)
        self.ln(1)


def generate_pdf(disc: dict) -> bytes:
    """Generate a single discrepancy PDF and return as bytes."""
    pdf = DiscrepancyPDF(orientation="P", unit="mm", format="A4")
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.add_page()

    # ------------------------------------------------------------------ #
    # Title block
    # ------------------------------------------------------------------ #
    pdf.set_fill_color(*DiscrepancyPDF.COLORS["header_bg"])
    pdf.set_text_color(*DiscrepancyPDF.COLORS["header_text"])
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, disc["id"], ln=False, fill=True)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_x(pdf.get_x())
    pdf.set_text_color(*DiscrepancyPDF.COLORS["body_text"])
    pdf.ln(12)

    # ------------------------------------------------------------------ #
    # Meta header grid
    # ------------------------------------------------------------------ #
    pdf.set_fill_color(*DiscrepancyPDF.COLORS["section_bg"])
    pdf.set_font("Helvetica", "", 9)
    col_w = 95
    meta_pairs = [
        ("Simulator ID", disc["sim_id"]),
        ("Aircraft Type", disc["aircraft"]),
        ("Date Discovered", disc["date_discovered"]),
        ("Reported By", disc["reported_by"]),
    ]
    for i, (label, value) in enumerate(meta_pairs):
        if i % 2 == 0 and i > 0:
            pdf.ln()
        pdf.set_font("Helvetica", "B", 9)
        pdf.cell(32, 6, label + ":", ln=False)
        pdf.set_font("Helvetica", "", 9)
        pdf.cell(col_w - 32, 6, value, ln=(i % 2 == 1))
    pdf.ln(4)

    # ------------------------------------------------------------------ #
    # Category heading
    # ------------------------------------------------------------------ #
    pdf.set_fill_color(*DiscrepancyPDF.COLORS["header_bg"])
    pdf.set_text_color(*DiscrepancyPDF.COLORS["header_text"])
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(0, 8, f"  {disc['category']}", ln=True, fill=True)
    pdf.set_text_color(*DiscrepancyPDF.COLORS["body_text"])
    pdf.ln(4)

    # ------------------------------------------------------------------ #
    # Description
    # ------------------------------------------------------------------ #
    pdf.section_heading("DISCREPANCY DESCRIPTION")
    pdf.body_text(disc["description"])

    # ------------------------------------------------------------------ #
    # Severity
    # ------------------------------------------------------------------ #
    pdf.section_heading("SEVERITY CLASSIFICATION")
    pdf.severity_badge(disc["severity"])

    # ------------------------------------------------------------------ #
    # Troubleshooting log
    # ------------------------------------------------------------------ #
    pdf.section_heading("TROUBLESHOOTING LOG")
    pdf.troubleshooting_table(disc["troubleshooting_log"])

    # ------------------------------------------------------------------ #
    # Root cause
    # ------------------------------------------------------------------ #
    pdf.section_heading("ROOT CAUSE ANALYSIS")
    pdf.body_text(disc["root_cause"])

    # ------------------------------------------------------------------ #
    # Corrective action
    # ------------------------------------------------------------------ #
    pdf.section_heading("CORRECTIVE ACTION")
    pdf.body_text(disc["corrective_action"])

    # ------------------------------------------------------------------ #
    # Cross references
    # ------------------------------------------------------------------ #
    pdf.section_heading("CROSS-REFERENCES")
    pdf.cross_ref_list(disc["cross_references"])

    # ------------------------------------------------------------------ #
    # Verification
    # ------------------------------------------------------------------ #
    pdf.section_heading("POST-REPAIR VERIFICATION")
    pdf.body_text(disc["verification"])

    # ------------------------------------------------------------------ #
    # Footer stamp
    # ------------------------------------------------------------------ #
    pdf.ln(4)
    pdf.set_draw_color(*DiscrepancyPDF.COLORS["line"])
    pdf.set_line_width(0.4)
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(3)
    pdf.set_font("Helvetica", "I", 7)
    pdf.set_text_color(100, 100, 100)
    stamp_date = datetime.now().strftime("%Y-%m-%d %H:%M UTC")
    pdf.cell(0, 4, f"Generated: {stamp_date}  |  Document ID: {disc['id']}-RPT  |  FlightSafety International Maintenance Records System", ln=True)

    return bytes(pdf.output())


# ---------------------------------------------------------------------------
# Upload helpers
# ---------------------------------------------------------------------------

def upload_pdf(client: WorkspaceClient, volume_path: str, filename: str, data: bytes):
    """Upload PDF bytes to Databricks Volume."""
    dest = f"{volume_path}/{filename}"
    buf = io.BytesIO(data)
    client.files.upload(dest, buf, overwrite=True)
    return dest


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("Connecting to Databricks workspace (profile=DEFAULT)...")
    client = WorkspaceClient(profile="DEFAULT")

    total = len(DISCREPANCIES)
    print(f"Generating and uploading {total} discrepancy PDFs to {VOLUME_PATH}/\n")

    succeeded = []
    failed = []

    for i, disc in enumerate(DISCREPANCIES, start=1):
        disc_id = disc["id"]
        filename = f"{disc_id}.pdf"
        try:
            print(f"[{i:02d}/{total}] Generating {filename}...", end=" ", flush=True)
            pdf_bytes = generate_pdf(disc)
            dest = upload_pdf(client, VOLUME_PATH, filename, pdf_bytes)
            print(f"Uploaded ({len(pdf_bytes):,} bytes) -> {dest}")
            succeeded.append(disc_id)
        except Exception as exc:
            print(f"FAILED - {exc}")
            failed.append((disc_id, str(exc)))

    print(f"\n{'='*60}")
    print(f"Complete: {len(succeeded)}/{total} PDFs uploaded successfully.")
    if failed:
        print(f"\nFailed uploads ({len(failed)}):")
        for disc_id, err in failed:
            print(f"  {disc_id}: {err}")
    else:
        print("All uploads succeeded.")


if __name__ == "__main__":
    main()
