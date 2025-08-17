document.addEventListener("DOMContentLoaded", () => {
    console.log("Signup.js loaded and DOM ready");

    const form = document.getElementById("signupForm");
    if (!form) {
        console.error("Form not found!");
        return;
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        console.log("Signup form submitted");

        try {
            const name = document.getElementById("name").value.trim();
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value.trim();
            const gender = document.getElementById("gender").value;
            const dob = document.getElementById("dob").value;

            const response = await fetch("/api/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password, gender, dob })
            });

            const data = await response.json();
            console.log("Server response:", data);

            if (response.ok) {
                alert("Signup successful! Redirecting...");
                window.location.href = "index.html";
            } else {
                alert(data.message || "Signup failed.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Something went wrong. Please try again.");
        }
    });
});
