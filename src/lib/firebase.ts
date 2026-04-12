/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCUaOR_7zE1gWLcva525MDxTgvmpTyrekY",
  authDomain: "nova-meet-cdc38.firebaseapp.com",
  projectId: "nova-meet-cdc38",
  storageBucket: "nova-meet-cdc38.firebasestorage.app",
  messagingSenderId: "952305705458",
  appId: "1:952305705458:web:bf0ac8d384c9e45b450b6b"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
