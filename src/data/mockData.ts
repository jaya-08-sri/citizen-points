import { Activity } from "../types";

export const activities: Activity[] = [
  { name: "Community cleanup", points: "+50", evidence: "Organiser confirmation plus photo and location" },
  { name: "Tree planting", points: "+30", evidence: "Photo with location, confirmed by organiser" },
  { name: "Blood donation", points: "+100", evidence: "Confirmation from the authorised organisation" },
  { name: "Volunteering", points: "+25 to +100", evidence: "Organiser confirmation of hours" },
  { name: "Verified civic issue report", points: "+20", evidence: "Your report is approved by a verifier" },
  { name: "Emergency or community assistance", points: "Case-specific", evidence: "Evidence plus authorised verification" },
  { name: "Road safety awareness drive", points: "+40", evidence: "Organiser confirmation and event photos" },
  { name: "Neighbourhood water-saving drive", points: "+35", evidence: "Organiser confirmation and participation record" },
  { name: "Teaching or mentoring session", points: "+60", evidence: "Confirmation from the school or NGO" },
  { name: "Other approved social activity", points: "Rule-based", evidence: "Evidence standard defined for the activity" },
];

export const issueCategories = [
  "Illegal dumping",
  "Damaged road or pothole",
  "Broken streetlight",
  "Water leakage",
  "Blocked drain",
  "Public property damage",
  "Traffic hazard",
  "Littering",
  "Noise or pollution",
  "Other",
];
