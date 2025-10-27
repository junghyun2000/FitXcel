# FitXcel

This project is a mobile application built with React Native (Expo) and a Node.js backend. This app helps users plan workouts, log exercises, and track their fitness journey. It includes BMI and calorie tracking, exercise search, and gamified progress features.

## Technologies Used

Frontend:
- React Native
- Axios (for API calls)

Backend:
- Node.js
- Axios (for fetching external data)
- MongoDB
- render
- sendgrid
- pocketbase
- zustand


## Features

- Signup, Login, and Logout functionality for secure access.
- Password reset handler and Forgot password page for credential recovery.
- Automatic email sender (SendGrid) integration to handle password reset emails.
- Search Exercises by Muscle Group using an external API.
- Exercise List Display showing exercises with relevant details.
- Custom Exercise Adder to manually add exercises.
- Add to Workout Log Feature to track completed exercises.
- Workout Log Page to view current session data.
- Workout History Page to review past sessions.
- BMI Calculator for body mass index computation.
- BMI History Log Page to track BMI changes over time.
- Calorie Gauge that resets daily to monitor calorie intake.
- Quick Add & Full Calorie Entry for logging meals.
- Saved Meals Page for viewing and reusing previous meal entries.


## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/junghyun2000/FitXcel.git
```

### 2. Install Dependencies
#### Frontend
```
cd FitXcel
```
```
npm install
```
#### Backend
```
cd backend
```
```
npm install
```
### 3. Run the App

#### Start the Backend Server

In the terminal make sure you are inside the backend folder and run:
```
node index.js
```
The backend will start

#### Start the React Native App (frontend)

Open a new terminal, go to the FitXcel folder and run:
```
npx expo start
```

This will open the Expo Developer Tools in your browser.
You can then run the app on:

Android emulator

iOS simulator

Physical device using the Expo Go app

4. Reset password feature

The SENDGRID API key must be added to the .env file in the backend folder (You can find the SENDGRID API key in the "GITHUB - SENDGRID API KEY" card in the sprint 2 documentation column).

## Authors
Sangmin - Developer

Denny - Developer

Kamil - Developer

Junghyun - Developer

## License

[MIT](https://choosealicense.com/licenses/mit/)


## Notes
- Make sure both the frontend and backend are running at the same time.
- If you are testing on a physical device, ensure your device is on the same Wi-Fi network as your backend server.
