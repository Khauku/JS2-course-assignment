import { requireAuth, attachLogout } from "../ui/utils/auth-guard.js";
import { showToastFromSession } from "../ui/toast.js";

requireAuth("login.html");
attachLogout("#logoutBtn", "login.html");

showToastFromSession();