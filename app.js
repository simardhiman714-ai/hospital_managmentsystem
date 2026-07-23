const express = require("express");
const path = require("path");
const db = require("./routes/db");
const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.get("/", (req, res) => {
  res.render("index");
});
app.get("/login", (req, res) => {
  res.render("login");
});
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    const sql = "SELECT * FROM users WHERE email = ? AND password = ?";

    db.query(sql, [email, password], (err, result) => {
        if (err) {
            console.log(err);
            return res.send("Login Failed");
        }

        if (result.length > 0) {
            res.redirect("/dashboard");
        } else {
            res.send("Invalid Email or Password");
        }
    });
});

app.get("/dashboard", (req, res) => {
    res.render("dashboard");
});
app.get("/register", (req, res) => {
  res.render("register");
});
app.post("/register", (req, res) => {
    const { fullname, email, password, confirmPassword } = req.body;
     console.log("register route hits");
    if (password !== confirmPassword) {
        return res.send("Passwords do not match");
    }

    const sql = "INSERT INTO users (fullname, email, password) VALUES (?, ?, ?)";

    db.query(sql, [fullname, email, password], (err, result) => {
        if (err) {
            console.log(err);
            return res.send("Registration Failed");
        }

        res.redirect("/login");
    });
});

app.get("/about", (req, res) => {
  res.render("about");
});
app.get("/tables", (req, res) => {
    db.query("SHOW TABLES", (err, result) => {
        if (err) return res.send(err);
        res.send(result);
    });
});
app.get("/create-user-table", (req, res) => {
  const sql = `
    CREATE TABLE users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      fullname VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL
    )
  `;

  db.query(sql, (err) => {
    if (err) return res.send(err);
    res.send("Users table created successfully");
  });
});


app.post("/doctors/add", (req, res) => {

    const { name, specialization, phone } = req.body;

    const sql = "INSERT INTO doctors (name, specialization, phone) VALUES (?, ?, ?)";

    db.query(sql, [name, specialization, phone], (err) => {

        if (err) {
            console.log(err);
            return res.send("Doctor not added");
        }

        res.redirect("/doctors");
    });

});
app.get("/doctor/delete/:id", (req, res) => {

    db.query(
        "DELETE FROM doctors WHERE id=?",
        [req.params.id],
        (err) => {
            if (err) return res.send("Delete Failed");
            res.redirect("/doctors");
        }
    );

});
app.get("/doctor/edit/:id", (req, res) => {

    const sql = "SELECT * FROM doctors WHERE id = ?";

    db.query(sql, [req.params.id], (err, results) => {

        if (err) {
            console.log(err);
            return res.send("Database Error");
        }

        res.render("doctorsedit.ejs", {
            doctor: results[0]
        });

    });

});
app.post("/doctor/update/:id", (req, res) => {

    const { name, specialization, phone } = req.body;

    db.query(
        "UPDATE doctors SET name=?, specialization=?, phone=? WHERE id=?",
        [name, specialization, phone, req.params.id],
        (err) => {
            if (err) return res.send("Update Failed");
            res.redirect("/doctors");
        }
    );

});
app.get("/doctors", (req, res) => {

    const search = req.query.search;

    let sql = "SELECT * FROM doctors";
    let values = [];

    if (search && search.trim() !== "") {
        sql = "SELECT * FROM doctors WHERE name LIKE ?";
        values = [`%${search}%`];
    }

    db.query(sql, values, (err, results) => {

        if (err) {
            console.log(err);
            return res.send("Database Error");
        }

        res.render("doctors", { doctors: results });
    });
});
app.get("/services", (req, res) => {
  res.render("services");
});
// Contact page open karne ke liye
app.get("/contact", (req, res) => {
    res.render("contact");
});

// Form submit hone ke baad
app.post("/contact", (req, res) => {
    
    const { name, email, subject, message } = req.body;

    db.query(
        "INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)",
        [name, email, subject, message],
        (err) => {
            if (err) {
                console.log(err);
                return res.send("Database Error");
            }

            res.redirect("/thanku");
        }
    );
});
app.get("/thanku", (req, res) => {
    res.render("thanku");
});

app.post("/patient/add", (req, res) => {

    const { name, age, gender, phone, disease, blood_group, status } = req.body;

    const sql = `
        INSERT INTO patients
        (name, age, gender, phone, disease, blood_group, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [name, age, gender, phone, disease, blood_group, status],
        (err) => {

            if (err) {
                console.log(err);
                return res.send("Patient not added");
            }

            res.redirect("/patient");

        }
    );

});
app.get("/patient/edit/:id", (req, res) => {

    const sql = "SELECT * FROM patients WHERE id = ?";

    db.query(sql, [req.params.id], (err, results) => {

        if (err) {
            console.log(err);
            return res.send("Database Error");
        }

        res.render("editPatient", {
            patient: results[0]
        });

    });

});
app.post("/patient/update/:id", (req, res) => {

    const { name, age, gender, phone, disease, blood_group, status } = req.body;

    const sql = `
        UPDATE patients
        SET name = ?, age = ?, gender = ?, phone = ?, disease = ?, blood_group = ?, status = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [name, age, gender, phone, disease, blood_group, status, req.params.id],
        (err) => {

            if (err) {
                console.log(err);
                return res.send("Update Failed");
            }

            res.redirect("/patient");
        }
    );

});
app.get("/patient/delete/:id", (req, res) => {

    const patientId = req.params.id;

    // Step 1: Delete appointments of this patient
    const deleteAppointments = "DELETE FROM appointments WHERE patient_id = ?";

    db.query(deleteAppointments, [patientId], (err) => {

        if (err) {
            console.log(err);
            return res.send("Failed to delete appointments");
        }

        // Step 2: Delete patient
        const deletePatient = "DELETE FROM patients WHERE id = ?";

        db.query(deletePatient, [patientId], (err) => {

            if (err) {
                console.log(err);
                return res.send("Delete Failed");
            }

            res.redirect("/patient");

        });

    });

});
 app.get("/patient", (req, res) => {

    const search = req.query.search;
     console.log("Search =", search);
    let sql = "SELECT * FROM patients";
    let values = [];

    if (search && search.trim() !== "") {
        sql = "SELECT * FROM patients WHERE name LIKE ?";
        values = [`%${search.trim()}%`];
    }
    

    db.query(sql, values, (err, results) => {

        if (err) {
            console.log(err);
            return res.send("Database Error");
        }
        
        
        res.render("patient", { patients: results });

    });

});
app.get("/appointment",(req,res)=>{
    res.render("appointment");
});
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});