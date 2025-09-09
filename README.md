# JS2 Course Assignment - Social Media Front-End

## Overview
This is the Javascript 2 Course Assingment project. 
The goal is to build the front-end for a small **social media application** using **vanilla Javascript ( ES modules)**. 
The application connects to the [Noroff v2 API] for authentication, posts, and profile data.

## Features
- Register a new user
- Log in as a registered user
- View all posts in a feed
- View a single post (by clicking in the feed)
- Create, edit, and delete your own posts
- View all posts by another user
- View your own profile (with posts)
- Follow / unfollow other users
- Search posts

---

## Pages
- `/login.html` - Login page
- `/register.html` - Register page
- `/feed.html` - posts feed with search
- `/post/index.html?id={postId}` - Single post page
- `/profile.html` - My profile
- `/profile.html?name={handle}` - Another user´s profile

---

## Technologies Used
- HTML5
- CSS (Tailwind / custom CSS)
- Vanilla JavaScript (Es6 modules)
- Noroff v2 API (Auth + Social endpoints)
- Github Projects for planning
- Netlify

---

## Accesibility & Quality
- Semantic HTML structure
- Accesible forms with labels and `aria-live` error messages
- Keyboard-navigation UI
- Error and loading states for all API calls
- Prettier for consistent code formatting
- At least 3 functions documented with **JSDoc**
