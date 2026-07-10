/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AICoach from './pages/AICoach';
import AIDoctor from './pages/AIDoctor';
import Achievements from './pages/Achievements';
import Dashboard from './pages/Dashboard';
import Emergency from './pages/Emergency';
import EmergencyContacts from './pages/EmergencyContacts';
import FamilyHealth from './pages/FamilyHealth';
import FoodScanner from './pages/FoodScanner';
import HealthAlerts from './pages/HealthAlerts';
import HealthMarket from './pages/HealthMarket';
import HealthTwin from './pages/HealthTwin';
import Home from './pages/Home';
import Insurance from './pages/Insurance';
import Landing from './pages/Landing';
import LiveIncidentMap from './pages/LiveIncidentMap';
import Profile from './pages/Profile';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import VideoCall from './pages/VideoCall';
import Vitals from './pages/Vitals';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AICoach": AICoach,
    "AIDoctor": AIDoctor,
    "Achievements": Achievements,
    "Dashboard": Dashboard,
    "Emergency": Emergency,
    "EmergencyContacts": EmergencyContacts,
    "FamilyHealth": FamilyHealth,
    "FoodScanner": FoodScanner,
    "HealthAlerts": HealthAlerts,
    "HealthMarket": HealthMarket,
    "HealthTwin": HealthTwin,
    "Home": Home,
    "Insurance": Insurance,
    "Landing": Landing,
    "LiveIncidentMap": LiveIncidentMap,
    "Profile": Profile,
    "Reports": Reports,
    "Settings": Settings,
    "VideoCall": VideoCall,
    "Vitals": Vitals,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};