import { Router } from "express";
import pool from "../data/db.js";
const kolcsonzes = Router();

kolcsonzes.get("/", async (req,res)=>{
    let sql ="SELECT kolcsonzesek.id, konyvId, olvasoId, datum, visszahozva, konyvek.cim, olvasok.nev FROM kolcsonzesek LEFT JOIN konyvek ON konyvek.id = kolcsonzesek.konyvId LEFT JOIN olvasok ON olvasok.id = kolcsonzesek.olvasoId"
    const akt = req.query.aktiv;

    if (akt === "true") {
        sql += " WHERE kolcsonzesek.visszahozva = 'false'";
    }
    let [eredmeny] = await pool.query(sql);
    
    res.json(eredmeny);
})

kolcsonzes.post("/", async(req,res)=>{
    let { konyvId, olvasoId } = req.body;

    try {
        
        if (!Number.isInteger(konyvId) || !Number.isInteger(olvasoId)) {
            return res.status(400).send("A konyvId és az olvasoId kötelező egész szám!")
        }
        
        let sql = "SELECT * FROM konyvek WHERE id = ?";
        let [eredmeny] = await pool.query(sql, [konyvId]);
        let konyvek = eredmeny;


        sql = "SELECT * FROM konyvek WHERE id = ?";
        [eredmeny] = await pool.query(sql, [olvasoId]);
        let olvasok = eredmeny;

        if (konyvek.length === 0 || olvasok.length === 0) {
            return res.status(404).send("A könyv vagy az olvasó nem létezik!");
        }

        sql = "SELECT * FROM kolcsonzesek WHERE konyvId = ? AND visszahozva = 'false'";
        [eredmeny] = await pool.query(sql, [konyvId]);
        let aktiv = eredmeny;

        if (aktiv.length > 0) {
            return res.status(409).send("Ez a könyv már ki van kölcsönözve!");
        }

        let datum = new Date().toLocaleDateString("sv-SE");
        
        sql = "INSERT INTO kolcsonzesek (konyvId, olvasoId, datum, visszahozva) VALUES (?, ?, ?, 'false')";
        [eredmeny] = await pool.query(sql, [konyvId, olvasoId, datum]);

        return res.status(201).json({
            id: eredmeny.insertId,
            konyvId,
            olvasoId,
            datum,
            visszahozva: false
        });

    } catch (error) {
        res.status(500).send("Hiba van!");
    }

})

kolcsonzes.patch("/:id/visszahoz", async(req,res)=>{
    const id = Number(req.params.id);

    try {
        
        let sql = "SELECT * FROM kolcsonzesek WHERE id = ?";

        let [eredmeny] = await pool.query(sql, [id]);

        if (eredmeny.length === 0) {
            return res.status(404).send("Nincs ilyen kölcsönzés!");
        }
        if (eredmeny[0].visszahozva === "true") {
            return res.status(409).send("Ezt a könyvet már visszahozták!");
        }


        let datum = new Date().toLocaleDateString("sv-SE");

        sql = "UPDATE kolcsonzesek SET visszahozva = 'true', datum = ? WHERE id = ?";
        await pool.query(sql, [datum, id]);

        return res.json({
            id: id,
            visszahozva: true,
            visszahozasDatum: datum
        });

    } catch (error) {
        res.status(400).send("Hiba történt a visszahozás során!")
    }

})

export default kolcsonzes;