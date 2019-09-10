var express = require("express");
var app = express();
var mysql = require("mysql");
const path = require("path");
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const hbs = require("hbs");

// AUTH
var session = require("express-session");
var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;
var MySQLStore = require("express-mysql-session")(session);
var bcrypt = require("bcrypt");

app.use(express.static(path.join(__dirname, "views")));
app.set("public", path.join(__dirname, "public"));
app.set("view engine", "hbs");
app.use(express.urlencoded());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(logger("dev"));
const saltRounds = 10;

var options = {
  host: "localhost",
  user: "root",
  password: "infiniteminds123",
  database: "users"
};

var sessionStore = new MySQLStore(options);

app.use(
  session({
    secret: "keyboard car",
    resave: false,
    store: sessionStore,
    saveUninitialized: false
    // cookie: { secure: true }
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.isAuthenticated();
  next();
});

// app.use((req, res, next) => {
//   res.locals.authenticationMiddlewareSudija = authenticationMiddlewareSudija();
//   next();
// });

// app.use((req, res, next) => {
//   res.locals.isAuthenticated = req.isAuthenticated();
//   next();
// });

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "infiniteminds123",
  database: "users"
});

db.connect(err => {
  if (err) {
    console.log("DB connection failed " + err);
  } else {
    console.log("DB connection succeded!");
  }
});

app.get("/", (req, res) => {
  console.log(req.user);
  console.log(req.isAuthenticated());
  res.render("home");
});

app.get("/profileSudija", authenticationMiddlewareSudija(), (req, res) => {
  res.render("profileSudija");
});

app.get("/profileDelegat", authenticationMiddlewareDelegat(), (req, res) => {
  res.render("profileDelegat");
});

app.get("/loginSudija", (req, res) => {
  res.render("login_sudija");
});

app.get("/loginDelegat", (req, res) => {
  res.render("login_delegat");
});

passport.use(
  "sudija-login",
  new LocalStrategy((username, password, done) => {
    console.log(username);
    console.log(password);

    db.query(
      "SELECT id, password, zvanje FROM user WHERE zvanje='sudija' AND username = ?",
      [username],
      (err, result, fields) => {
        console.log(result);
        if (err) {
          done(err);
        }
        if (result.length === 0) {
          done(null, false);
        } else {
          console.log(result[0].password);
          const hash = result[0].password.toString();
          bcrypt.compare(password, hash, (err, res) => {
            if (res === true) {
              return done(null, {
                user: result[0]
              });
            } else {
              return done(null, false);
            }
          });
        }
      }
    );
  })
);

passport.use(
  "delegat-login",
  new LocalStrategy((username, password, done) => {
    console.log(username);
    console.log(password);

    db.query(
      "SELECT id, password, zvanje FROM user WHERE zvanje='delegat' AND username = ?",
      [username],
      (err, result, fields) => {
        if (err) {
          done(err);
        }
        if (result.length === 0) {
          done(null, false);
        } else {
          console.log(result[0].password);
          const hash = result[0].password.toString();
          bcrypt.compare(password, hash, (err, res) => {
            if (res === true) {
              return done(null, { user: result[0] });
            } else {
              return done(null, false);
            }
          });
        }
      }
    );
  })
);

app.post("/register", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const zvanje = req.body.zvanje;
  bcrypt.hash(password, saltRounds, function(err, hash) {
    db.query(
      "INSERT INTO user (username,password,zvanje) VALUES (?, ?, ?)",
      [username, hash, zvanje],
      (err, result) => {
        if (err) throw err;

        db.query(
          "SELECT LAST_INSERT_ID() as user_id",
          (err, result, fields) => {
            if (err) throw err;

            const user_id = result[0];

            console.log(result[0]);
            req.login(user_id, err => {
              res.redirect("/");
            });
          }
        );
        console.log("Uspeh!");
      }
    );
  });
});

app.post(
  "/login_sudija",
  passport.authenticate("sudija-login", {
    successRedirect: "/profileSudija",
    failureRedirect: "/loginSudija"
  })
);

app.post(
  "/login_delegat",
  passport.authenticate("delegat-login", {
    successRedirect: "/profileDelegat",
    failureRedirect: "/loginDelegat"
  })
);

app.get("/logout", (req, res) => {
  req.logout();
  req.session.destroy();
  res.redirect("/");
});

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

function authenticationMiddlewareSudija() {
  return (req, res, next) => {
    var pom = req.session.passport.user.user.zvanje;
    console.log(pom);

    if (req.isAuthenticated() && pom == "sudija") return next();
    res.redirect("/login");
  };
}

function authenticationMiddlewareDelegat() {
  return (req, res, next) => {
    var pom = req.session.passport.user.user.zvanje;
    console.log(pom);

    if (req.isAuthenticated() && pom == "delegat") return next();
    res.redirect("/login");
  };
}

app.listen(3000, () => {
  console.log("Listening on port 3000.....");
});
