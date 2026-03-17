import { createBrowserRouter } from "react-router";
import LandingPage from "./pages/LandingPage";
import RoomsPage from "./pages/RoomsPage";
import EventsPage from "./pages/EventsPage";
import AboutPage from "./pages/AboutPage";
import PoliciesPage from "./pages/PoliciesPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/rooms",
    Component: RoomsPage,
  },
  {
    path: "/events",
    Component: EventsPage,
  },
  {
    path: "/about",
    Component: AboutPage,
  },
  {
    path: "/policies/:type",
    Component: PoliciesPage,
  },
  {
    path: "*",
    Component: LandingPage,
  },
]);