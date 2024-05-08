const express = require('express');
const bodyParser = require('body-parser');
const Cloudant = require('@cloudant/cloudant');

const app = express();
const PORT = process.env.PORT || 8000;
const url = "https://apikey-v2-2e5kdlgplmovp6jb5xfuok6afjra827zegiyhiw2ul1u:d32ec5f34b80eec562777356d8d80d1b@b9884815-a388-4e5e-8d1d-784e73de0044-bluemix.cloudantnosqldb.appdomain.cloud";
const username = "apikey-v2-2e5kdlgplmovp6jb5xfuok6afjra827zegiyhiw2ul1u";
const password = "d32ec5f34b80eec562777356d8d80d1b";

app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

// app.get('/', (req, res) => {
//   res.sendFile(__dirname + '/public/index.html');
// });

app.post('/signup', (req, res) => {
  const { name, email, upassword } = req.body;

  const cloudant = Cloudant({ url: url, username: username, password: password });
  const usersDB = cloudant.use('users');

  usersDB.get(name, (err, body) => {
    if (!err && body) {
      // Email already exists
      console.log('Name already exists:', name);
      res.status(400).send('Email already exists');
    } else {
      if (err && err.statusCode === 404) {
        // Email does not exist, create new user
        const newUser = { _id: name, email: email, upassword: upassword };
        usersDB.insert(newUser, (err, result) => {
          if (err) {
            console.error('Error creating user:', err);
            res.status(500).send('Error creating user');
          } else {
            console.log('User created successfully:', name);
            res.status(200).send('User created successfully');
          }
        });
      } else {
        console.error('Error getting user:', err);
        res.status(500).send('Error checking existing user');
      }
    }
  });
});

app.post('/signin', (req, res) => {
  const { name, upassword } = req.body;

  const cloudant = Cloudant({ url: url, username: username, password: password });
  const usersDB = cloudant.use('users');

  usersDB.get(name, (err, body) => {
      if (!err && body) {
          // User found, check password
          if (body.upassword === upassword) {
              console.log('Sign in successful:', name);
              res.redirect(`/home.html?name=${name}`);
          } else {
              console.log('Invalid password:', name);
              res.status(400).send('Invalid email or password');
          }
      } else {
          if (err && err.statusCode === 404) {
              // User not found
              console.error('User not found:', name);
              res.status(400).send('User not found');
          } else {
              console.error('Error getting user:', err);
              res.status(500).send('Error checking user');
          }
      }
  });
});

app.post('/wishlist', (req, res) => {
  const { title, genre, image, userName } = req.body;

  const cloudant = Cloudant({ url: url, username: username, password: password });
  const wishlistDB = cloudant.use('wishlist');

  const movieData = { title: title, genre: genre, image: image, userName: userName };

  wishlistDB.insert(movieData, (err, result) => {
    if (err) {
      console.error('Error adding movie to wishlist:', err);
      res.status(500).send('Error adding movie to wishlist');
    } else {
      console.log('Movie added to wishlist:', result.id);
      res.status(200).send('Movie added to wishlist successfully');
    }
  });
});

app.get('/wishlist', (req, res) => {
  // Extract user's name from the URL parameter
  const name = req.query.name;

  if (!name) {
    return res.status(400).send('User name parameter is required');
  }

  // Connect to Cloudant
  const cloudant = Cloudant({ url: url, username: username, password: password });
  const wishlistDB = cloudant.use('wishlist'); // Assuming 'wishlist' is your database name

  // Query Cloudant to fetch watchlist data for the specific user
  wishlistDB.find({ selector: { userName: name } }, (err, body) => {
    if (err) {
      console.error('Error fetching wishlist:', err);
      res.status(500).send('Error fetching wishlist');
    } else {
      const wishlist = body.docs.map(doc => ({ _id: doc._id, _rev: doc._rev, ...doc })); // Include _id and _rev in each document
      res.send(wishlist);
    }
  });
});


app.delete('/wishlist/:id', (req, res) => {
  const id = req.params.id;
  const rev = req.body.rev; // Assuming the client sends the revision number in the request body

  if (!id || !rev) {
    return res.status(400).send('ID and revision number are required');
  }

  // Connect to Cloudant
  const cloudant = Cloudant({ url: url, username: username, password: password });
  const wishlistDB = cloudant.use('wishlist');

  // Delete the document from Cloudant
  wishlistDB.destroy(id, rev, (err, body) => {
    if (err) {
      console.error('Error deleting document:', err);
      res.status(500).send('Error deleting document');
    } else {
      console.log('Document deleted successfully:', body);
      res.status(200).send('Document deleted successfully');
    }
  });
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});