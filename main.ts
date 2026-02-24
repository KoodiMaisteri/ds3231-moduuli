namespace RTC {
    const RTC_ADDR = 104; // 0x68 desimaalina
    const REG_SEC = 0;

    // --- APUFUNKTIOT (BCD-muunnokset) ---
    function decToBcd(val: number): number {
        return Math.floor(val / 10) * 16 + (val % 10);
    }

    function bcdToDec(val: number): number {
        return Math.floor(val / 16) * 10 + (val % 16);
    }

    function lueRekisteri(reg: number): number {
        pins.i2cWriteNumber(RTC_ADDR, reg, NumberFormat.UInt8BE, false);
        return pins.i2cReadNumber(RTC_ADDR, NumberFormat.UInt8BE, false);
    }

    /**
     * Asettaa RTC-kellon ajan ja päivämäärän. Sekunnit nollautuvat automaattisesti.
     * @param vuosi esim. 2026
     * @param kuukausi 1-12
     * @param paiva 1-31
     * @param tunti 0-23
     * @param minuutti 0-59
     */
    //% block="Aseta aika: vuosi %vuosi kuukausi %kuukausi päivä %paiva tunti %tunti minuutti %minuutti"
    //% weight=100
    //% vuosi.min=2000 vuosi.max=2099 vuosi.defl=2026
    //% kuukausi.min=1 kuukausi.max=12 kuukausi.defl=1
    //% paiva.min=1 paiva.max=31 paiva.defl=1
    //% tunti.min=0 tunti.max=23 tunti.defl=12
    //% minuutti.min=0 minuutti.max=59 minuutti.defl=0
    export function asetaAika(vuosi: number, kuukausi: number, paiva: number, tunti: number, minuutti: number): void {
        let buf = pins.createBuffer(8);
        let lyhytVuosi = vuosi % 100; // DS3231 tallentaa vain kaksi viimeistä numeroa
        let sekunti = 0;
        let viikonpaiva = 1; // Oletusarvo, jos viikonpäivää ei tarvita

        buf[0] = REG_SEC;
        buf[1] = decToBcd(sekunti);
        buf[2] = decToBcd(minuutti);
        buf[3] = decToBcd(tunti);
        buf[4] = decToBcd(viikonpaiva);
        buf[5] = decToBcd(paiva);
        buf[6] = decToBcd(kuukausi);
        buf[7] = decToBcd(lyhytVuosi);

        pins.i2cWriteBuffer(RTC_ADDR, buf);
    }

    /**
     * Palauttaa ajan muodossa HH:MM:SS
     */
    //% block="Lue aika (hh:mm:ss)"
    //% weight=90
    export function lueAika(): string {
        pins.i2cWriteNumber(RTC_ADDR, REG_SEC, NumberFormat.UInt8BE, false);
        // Luetaan 3 tavua kerralla: sekunnit, minuutit, tunnit
        let timeBuf = pins.i2cReadBuffer(RTC_ADDR, 3);

        let sekunti2 = bcdToDec(timeBuf[0] & 0x7F);
        let minuutti = bcdToDec(timeBuf[1]);
        // Maskataan bitit 0x3F, jotta 12/24h moodibitit eivät sotke lukua
        let tunti = bcdToDec(timeBuf[2] & 0x3F);

        // Lisätään nolla eteen, jos luku on alle 10
        let strTunti = (tunti < 10 ? "0" : "") + tunti;
        let strMin = (minuutti < 10 ? "0" : "") + minuutti;
        let strSek = (sekunti2 < 10 ? "0" : "") + sekunti2;

        return strTunti + ":" + strMin + ":" + strSek;
    }

    /**
     * Palauttaa tallennetun vuoden (esim. 2026)
     */
    //% block="Vuosi"
    //% weight=80
    export function lueVuosi(): number {
        let val = lueRekisteri(6); // Rekisteri 0x06
        return 2000 + bcdToDec(val);
    }

    /**
     * Palauttaa tallennetun kuukauden (1-12)
     */
    //% block="Kuukausi"
    //% weight=75
    export function lueKuukausi(): number {
        let val2 = lueRekisteri(5); // Rekisteri 0x05
        return bcdToDec(val2 & 0x1F); // Maskataan pois mahdollinen vuosisatabitti
    }

    /**
     * Palauttaa tallennetun päivän (1-31)
     */
    //% block="Päivä"
    //% weight=70
    export function luePaiva(): number {
        let val3 = lueRekisteri(4); // Rekisteri 0x04
        return bcdToDec(val3 & 0x3F);
    }

    /**
     * Palauttaa tallennetun tunnin (0-23)
     */
    //% block="Tunti"
    //% weight=65
    export function lueTunti(): number {
        let val4 = lueRekisteri(2); // Rekisteri 0x02
        return bcdToDec(val4 & 0x3F);
    }

    /**
     * Palauttaa tallennetut minuutit (0-59)
     */
    //% block="Minuutti"
    //% weight=60
    export function lueMinuutti(): number {
        let val5 = lueRekisteri(1); // Rekisteri 0x01
        return bcdToDec(val5 & 0x7F);
    }

    /**
     * Palauttaa tallennetut sekunnit (0-59)
     */
    //% block="Sekunnit"
    //% weight=55
    export function lueSekunnit(): number {
        let val6 = lueRekisteri(0); // Rekisteri 0x00
        return bcdToDec(val6 & 0x7F);
    }
}
