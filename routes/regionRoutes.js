import express from "express";
import { regions } from "../config/regions.js";
const router = express.Router();

router.get("/main", (req,res)=>{
  res.json(regions.main);
});

router.get("/sub/:main", (req,res)=>{
  const map = {
    "மாதவரம் பகுதி":"madhavaram",
    "புழல் ஒன்றியம்":"puzhal",
    "வில்லிவாக்கம் ஒன்றியம்":"villivakkam",
    "சோழவரம் ஒன்றியம்":"cholavaram"
  };
  const key = map[req.params.main];
  res.json(regions[key] || []);
});

export default router;
