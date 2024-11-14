const express = require("express");
const bp = require("body-parser");
const mongoose = require("mongoose");
const app = express();
const { exec } = require("child_process"); // Import child_process for executing Python scripts
const credent = __dirname+"/X509-cert-8739069001266662074.pem"
mongoose.connect("mongodb+srv://cluster0.qcd6n.mongodb.net/todo?authSource=%24external&authMechanism=MONGODB-X509&retryWrites=true&w=majority&appName=Cluster0",
  {tlsCertificateKeyFile:credent}
);
const schema = mongoose.Schema;

// Function to generate unique ID by calling the Python script
function generateUniqueID(callback) {
  exec("python passkeygen.py", (error, stdout, stderr) => {
    if (error) {
      console.error(`Error generating ID: ${error.message}`);
      return callback(null);
    }
    if (stderr) {
      console.error(`Python stderr: ${stderr}`);
      return callback(null);
    }
    // Trim and return the generated password
    callback(stdout.trim());
  });
}

// Schemas
const itemSchema = new schema({
  todo_item: String,
  id: String,
});
const listSchems = new schema({
  id: String,
  name: String,
  items: [itemSchema],
});

const userSchema = new schema({
  username: {
    type: String,
    unique: true,
    trim: true,
  },
  lists: [listSchems],
});

//Collection Models
const Item = new mongoose.model("Item", itemSchema);
const List = new mongoose.model("List", listSchems);
const User = new mongoose.model("User", userSchema);

app.set("view engine", "ejs");
app.use(bp.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
  res.render("landing", { Title: "Todo V3" });
});
app.post("/", (req, res) => {
  let user_name = req.body.username.toLowerCase().trim();
  if (user_name.includes("@")) {
     user_name = user_name.slice(1);
  }
  User.find({ username: user_name }).then((e) => {
    if (e.length === 0) {
      // generateUniqueID((uniqueID) => {
      //     if (uniqueID) {
      //         console.log(uniqueID)

      //     } else {
      //         res.status(500).send("Failed to generate unique ID");
      //     }
      // })
      let user = new User({ username: user_name });
      user.save().then(() => {
        let Uid = user._id.toString();
        res.redirect("/" + user_name);
      });
      
    } else {
      User.findOne({ username: user_name }).then((usr) => {
        let Uid = usr._id.toString();
        res.redirect("/" + user_name);
      });
    }
  });
});
app.post("/:Uid/:customList/delete", (req, res) => {
  let par = req.params.Uid;
  let listname = req.params.customList;
  let checkedItem = req.body.checkbox;
  Item.findByIdAndDelete(checkedItem).then((e) => {
    res.redirect(`/${par}/${listname}`);
  });
});
app.post("/:Uid/:customList/deletedb", (req, res) => {
  let par = req.params.Uid;
  let listname = req.params.customList;
  let dbcoll = req.body.deldb;
  User.findOne({ username: par }).then((user) => {
    let Uid = user._id.toString();
    List.findOneAndDelete({ name: listname, id: Uid }).then(() => {
      List.find({ id: Uid }).then((updatedLists) => {
        User.findOneAndUpdate(
          { username: par, _id: Uid },
          { lists: updatedLists }
        ).then(() => res.redirect(`/${par}`)); // redirect after updating the lists
      });
    });
  });
});
app.get("/favicon.ico", (req, res) => {
  res.status(404);
});

app.get("/:Uid", (req, res) => {
  let par = req.params.Uid;
  let listsSelects = [];
  listsSelects.length = 0;
  User.findOne({ username: par })
    .then((e) => {
      

      listsSelects = e.lists; // Ensure listsSelects is an array

      if (listsSelects.length === 0) {
        // Disable the dropdown if no lists are found
        res.render("logged", {
          Title: "Todo V3",
          Username: par,
          av_list_name: [], // Send empty array
          enb: "disabled", // Disable dropdown in EJS
        });
      } else {
        // Populate dropdown if lists exist
        res.render("logged", {
          Title: "Todo V3",
          Username: par,
          av_list_name: listsSelects,
          enb: "", // Enable dropdown
        });
      }
    })
    .catch((err) => console.error(err));
});

app.post("/:Uid", (req, res) => {
  const par = req.params.Uid;
  const listnameinp = req.body.list_name_inp;
  const listnamesel = req.body.list_name_sel;
 
  User.findOne({ username: par }).then((e) => {
    let Uid = e._id.toString();
    let lnames = [];
    listsSelects = e.lists;
    listsSelects.forEach((element) => {
      lnames.push(element.name);
    });

    if (
      (lnames.includes(listnameinp) || listnameinp == "") &&
      (listnamesel == "" || listnamesel == undefined)
    ) {
      res.redirect("/" + par + "/" + listnameinp);
    } else {
      if (listnamesel != "" && listnamesel != undefined && listnameinp == "") {
        res.redirect("/" + par + "/" + listnamesel);
      } else {
        if (
          listnamesel != "" &&
          listnamesel != undefined &&
          listnameinp != ""
        ) {
          res.redirect("/" + par + "/" + listnamesel);
        } else {
          let list = new List({ id: Uid, name: listnameinp });
          list.save().then((succ) => {
            List.find({ id: Uid })
              .then((e) => {
                User.findOneAndUpdate({ username: par }, { lists: e }).then(
                  (e) => {
                    console.log("");
                  }
                );
              })
              .catch((err) => {
                console.log();
              });
            res.redirect("/" + par + "/" + listnameinp);
          });
        }
      }
    }
  });
});
app.get("/:Uid/:customList", (req, res) => {
  const par = req.params.Uid;
  const listname = req.params.customList;
  User.findOne({ username: par }).then((user) => {
    let Uid = user._id.toString();
    List.findOne({ name: listname, id: Uid }).then((list) => {
      let Lid = list._id.toString();
      Item.find({ id: Lid }).then((items) => {
        res.render("list", { items: items, Title: listname, Username: par });
      });
    });
  });
});
app.post("/:Uid/:customList", (req, res) => {
  const par = req.params.Uid;
  let listTitle = req.body.listName;
  let listItem = req.body.item;
  User.findOne({ username: par }).then((user) => {
    let Uid = user._id.toString();
    List.findOne({ id: Uid, name: listTitle }).then((list) => {
      let Lid = list._id.toString();
      let item = new Item({
        id: Lid,
        todo_item: listItem,
      });
      item.save().then((succ) => {
        Item.find({ id: Lid }).then((e) => {
          List.findOneAndUpdate(
            { id: Uid, name: listTitle },
            { items: e }
          ).then((p) => {
            List.find({ id: Uid }).then((u) => {
              User.findOneAndUpdate({ username: par }, { lists: u }).then(
                (z) => {
                  console.log("");
                }
              );
            });
            res.redirect(`/${par}/${listTitle}`);
          });
        });
      });
    });
  });

  // items.push(listItem)
  // res.redirect('/'+Uid+'/'+listTitle)
});

app.listen(process.env.PORT||3000, function () {
  console.log("started runnning on port 3000");
});
