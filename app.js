// app.js - CFL Analysis Interactive Engine

// Raw CSV Database with simplified tags format [tag1,tag2,...]
const RAW_CSV_DATA = `id;title;desc;service;classification;pssi;tags;owner;frequency;lastRefresh;pbirsPath;viewcount;adGroups;pbirsUrl
rep-1;Analyse de la ponctualité au départ;Analyse des performances de ponctualité des trains au point de départ de leur circulation.;Qualité;self-service;public;[Ponctualité, Performance opérationnelle];Sylvain Rauch;Hebdomadaire;46176,94305;/QUALITE/ANALYSES AD HOC/Analyse de la ponctualité au départ;1712;DW_POWERBI_QUALITE_ANALYSESADHOC;https://powerbi.cfl.lu/reports/powerbi/DW_FOLDER/QUALITE/ANALYSES%20AD%20HOC/Analyse%20de%20la%20ponctualité%20au%20départ
rep-2;Analyse hebdo des causes retard;Suivi hebdomadaire des principales causes de retards observées sur le réseau.;Qualité;self-service;interne;[Ponctualité, Performance opérationnelle];Gilles Becker;Mensuel;46038,71527;/QUALITE/ANALYSES AD HOC/Analyse hebdo des causes retard;1774;DW_POWERBI_QUALITE_ANALYSESADHOC;https://powerbi.cfl.lu/reports/powerbi/DW_FOLDER/QUALITE/ANALYSES%20AD%20HOC/Analyse%20hebdo%20des%20causes%20retard
rep-3;Analyse train;Analyse détaillée de la performance et des incidents d'un train ou d'un ensemble de trains.;Qualité;self-service;public;[Performance opérationnelle, Ponctualité];Sylvain Rauch;Hebdomadaire;46047,35143;/QUALITE/ANALYSES AD HOC/Analyse train;368;DW_POWERBI_QUALITE_ANALYSESADHOC;https://powerbi.cfl.lu/reports/powerbi/DW_FOLDER/QUALITE/ANALYSES%20AD%20HOC/Analyse%20train
rep-4;Annonces GSM-R;Suivi des annonces et communications diffusées via le réseau GSM-R.;Qualité;self-service;public;[Information voyageurs, Performance opérationnelle];Gilles Becker;Mensuel;46024,12619;/QUALITE/ANALYSES AD HOC/Annonces GSM-R;1116;DW_POWERBI_QUALITE_ANALYSESADHOC;https://powerbi.cfl.lu/reports/powerbi/DW_FOLDER/QUALITE/ANALYSES%20AD%20HOC/Annonces%20GSM-R
rep-5;Nb trains (planifiés) et voyageurs passant par établissement;Statistiques des trains planifiés et des flux voyageurs par établissement.;Qualité;self-service;public;[Volume d'activité, Performance opérationnelle];Gilles Becker;Mensuel;46038,85115;/QUALITE/ANALYSES AD HOC/Nb trains (planifiés) et voyageurs passant par établissement;1179;DW_POWERBI_QUALITE_ANALYSESADHOC;https://powerbi.cfl.lu/reports/powerbi/DW_FOLDER/QUALITE/ANALYSES%20AD%20HOC/Nb%20trains%20(planifiés)%20et%20voyageurs%20passant%20par%20établissement
rep-6;Rapport forces majeures;Identification et suivi des impacts liés aux événements de force majeure.;Qualité;self-service;public;[Performance opérationnelle, Infrastructure];Gilles Becker;Hebdomadaire;46075,64475;/QUALITE/ANALYSES AD HOC/Rapport forces majeures;391;DW_POWERBI_QUALITE_ANALYSESADHOC;https://powerbi.cfl.lu/reports/powerbi/DW_FOLDER/QUALITE/ANALYSES%20AD%20HOC/Rapport%20forces%20majeures
rep-7;Rapports ponctualité;Vue consolidée des indicateurs de ponctualité du trafic ferroviaire.;Qualité;self-service;interne;[Ponctualité, Pilotage direction];Gilles Becker;Hebdomadaire;46219,65834;/QUALITE/ANALYSES AD HOC/Rapports ponctualité;888;DW_POWERBI_QUALITE_ANALYSESADHOC;https://powerbi.cfl.lu/reports/powerbi/DW_FOLDER/QUALITE/ANALYSES%20AD%20HOC/Rapports%20ponctualité
rep-8;Retards réguliers;Analyse des retards récurrents afin d'identifier les problématiques structurelles.;Qualité;self-service;public;[Ponctualité, Performance opérationnelle];Gilles Becker;Quotidien;46193,48031;/QUALITE/ANALYSES AD HOC/Retards réguliers;1556;DW_POWERBI_QUALITE_ANALYSESADHOC;https://powerbi.cfl.lu/reports/powerbi/DW_FOLDER/QUALITE/ANALYSES%20AD%20HOC/Retards%20réguliers
rep-9;Clearing Code 5XX;Suivi et analyse des retards associés aux codes causes de la série 5XX.;Qualité;dwh;public;[Ponctualité, Performance opérationnelle];Gilles Becker;Hebdomadaire;46133,67525;/QUALITE/Clearing/Clearing Code 5XX;1410;DW_POWERBI_QUALITE_CLEARINGEF;https://powerbi.cfl.lu/reports/powerbi/DW_FOLDER/QUALITE/Clearing/Clearing%20Code%205XX
rep-10;Écrans H00;Visualisation synthétique des indicateurs opérationnels utilisés lors du point H00.;Qualité;dwh;confidentiel;[Performance opérationnelle, Pilotage direction];Gilles Becker;Mensuel;46211,2153;/QUALITE/H00/Écrans H00;483;DW_POWERBI_QUALITE_H00;https://powerbi.cfl.lu/reports/powerbi/DW_FOLDER/QUALITE/H00/Écrans%20H00
rep-11;Quotidienne H00;Rapport quotidien des principaux indicateurs de qualité et d'exploitation.;Qualité;dwh;confidentiel;[Performance opérationnelle, Pilotage direction];Sylvain Rauch;Mensuel;46201,76182;/QUALITE/H00/Quotidienne H00;1296;DW_POWERBI_QUALITE_H01;https://powerbi.cfl.lu/reports/powerbi/DW_FOLDER/QUALITE/H00/Quotidienne%20H00
rep-12;Tableau de bord H00;Tableau de bord centralisant les indicateurs clés suivis lors des réunions H00.;Qualité;dwh;interne;[Performance opérationnelle, Pilotage direction];Sylvain Rauch;Hebdomadaire;46023,7002;/QUALITE/H00/Tableau de bord H00;1999;DW_POWERBI_QUALITE_H02;https://powerbi.cfl.lu/reports/powerbi/DW_FOLDER/QUALITE/H00/Tableau%20de%20bord%20H00
rep-13;Internet - DE;Publication des indicateurs qualité destinés au site internet en allemand.;Qualité;dwh;public;[Publication, Ponctualité];Gilles Becker;Hebdomadaire;46222,57127;/QUALITE/PUBLIC/OLD/Internet - DE;403;DW_POWERBI_QUALITE;https://powerbi.cfl.lu/reports/powerbi/DW_FOLDER/QUALITE/PUBLIC/OLD/Internet%20-%20DE
rep-14;Internet - EN;Publication des indicateurs qualité destinés au site internet en anglais.;Qualité;dwh;public;[Publication, Ponctualité];Gilles Becker;Mensuel;46091,23106;/QUALITE/PUBLIC/OLD/Internet - EN;518;DW_POWERBI_QUALITE;https://powerbi.cfl.lu/reports/powerbi/DW_FOLDER/QUALITE/PUBLIC/OLD/Internet%20-%20EN
rep-15;Internet - FR;Publication des indicateurs qualité destinés au site internet en français.;Qualité;dwh;public;[Publication, Ponctualité];Gilles Becker;Quotidien;46169,87032;/QUALITE/PUBLIC/OLD/Internet - FR;892;DW_POWERBI_QUALITE;https://powerbi.cfl.lu/reports/powerbi/DW_FOLDER/QUALITE/PUBLIC/OLD/Internet%20-%20FR
rep-16;Ponctualité;Présentation publique des résultats de ponctualité du réseau ferroviaire.;Qualité;dwh;public;[Publication, Ponctualité];Gilles Becker;Hebdomadaire;46115,92717;/QUALITE/PUBLIC/Ponctualité;885;DW_POWERBI_QUALITE;https://powerbi.cfl.lu/reports/powerbi/DW_FOLDER/QUALITE/PUBLIC/Ponctualité
rep-17;Rapport de publication mensuelle de ponctualité;Rapport mensuel destiné à la communication des performances de ponctualité.;Qualité;dwh;public;[Publication, Ponctualité];Gilles Becker;Mensuel;46124,32626;/QUALITE/PUBLIC/Rapport de publication mensuelle de ponctualité;887;DW_POWERBI_QUALITE;https://powerbi.cfl.lu/reports/powerbi/DW_FOLDER/QUALITE/PUBLIC/Rapport%20de%20publication%20mensuelle%20de%20ponctualité
rep-18;Qualité des données;Contrôle et suivi de la qualité des données utilisées pour le reporting.;Qualité;dwh;restreint;[Qualité des données];Sylvain Rauch;Quotidien;46149,80087;/QUALITE/Qualité des données/Qualité des données;943;DW_POWERBI_QUALITE_ALL_STAFF;https://powerbi.cfl.lu/reports/powerbi/DW_FOLDER/QUALITE/Qualité%20des%20données/Qualité%20des%20données
rep-19;Vérification des heures BVU;Contrôle de cohérence des horaires et événements enregistrés dans BVU.;Qualité;dwh;interne;[Qualité des données];Sylvain Rauch;Quotidien;46100,12446;/QUALITE/Qualité des données/Vérification des heures BVU;1827;DW_POWERBI_QUALITE;https://powerbi.cfl.lu/reports/powerbi/DW_FOLDER/QUALITE/Qualité%20des%20données/Vérification%20des%20heures%20BVU
rep-20;Réclamations;Analyse des réclamations clients et de leur évolution dans le temps.;Qualité;dwh;interne;[Satisfaction client];Gilles Becker;Hebdomadaire;46067,99758;/QUALITE/Réclamations/Réclamations;28;DW_POWERBI_QUALITE;https://powerbi.cfl.lu/reports/powerbi/DW_FOLDER/QUALITE/Réclamations/Réclamations
rep-21;Roadmap IV;Suivi global des actions et indicateurs liés à l'information voyageurs.;Qualité;dwh;interne;[Information voyageurs, Pilotage direction];Sylvain Rauch;Quotidien;46069,30387;/QUALITE/ROADMAP IV/Roadmap IV;1516;DW_POWERBI_QUALITE_TBOPERATIONNELS_INFOVOY;https://powerbi.cfl.lu/reports/powerbi/DW_FOLDER/QUALITE/ROADMAP%20IV/Roadmap%20IV
rep-22;Roadmap IV - 2024;Suivi des objectifs et réalisations de la Roadmap IV pour l'année 2024.;Qualité;dwh;interne;[Information voyageurs, Pilotage direction];Sylvain Rauch;Hebdomadaire;46218,73013;/QUALITE/ROADMAP IV/Roadmap IV - 2024;1857;DW_POWERBI_QUALITE_TBOPERATIONNELS_INFOVOY;https://powerbi.cfl.lu/reports/powerbi/DW_FOLDER/QUALITE/ROADMAP%20IV/Roadmap%20IV%20-%202024
rep-23;Roadmap IV - 2025;Suivi des objectifs et réalisations de la Roadmap IV pour l'année 2025.;Qualité;dwh;public;[Information voyageurs, Pilotage direction];Gilles Becker;Mensuel;46043,25597;/QUALITE/ROADMAP IV/Roadmap IV - 2025;396;DW_POWERBI_QUALITE_TBOPERATIONNELS_INFOVOY;https://powerbi.cfl.lu/reports/powerbi/DW_FOLDER/QUALITE/ROADMAP%20IV/Roadmap%20IV%20-%202025
rep-24;Barometre Qualite;Suivi des indicateurs de satisfaction et de perception de la qualité de service.;Qualité;dwh;confidentiel;[Satisfaction client, Pilotage direction];Sylvain Rauch;Quotidien;46035,45123;/QUALITE/Satisfaction Clients/Barometre Qualite;1142;DW_POWERBI_QUALITE_BAROMETRE;https://powerbi.cfl.lu/reports/powerbi/DW_FOLDER/QUALITE/Satisfaction%20Clients/Barometre%20Qualite
rep-25;Satisfaction clients des espaces sanitaires;Mesure de la satisfaction des voyageurs concernant les installations sanitaires.;Qualité;dwh;confidentiel;[Satisfaction client];Gilles Becker;Quotidien;46211,62882;/QUALITE/Satisfaction Clients/Satisfaction clients des espaces sanitaires;1688;DW_POWERBI_QUALITE;https://powerbi.cfl.lu/reports/powerbi/DW_FOLDER/QUALITE/Satisfaction%20Clients/Satisfaction%20clients%20des%20espaces%20sanitaires
rep-26;1 Objectifs;Suivi des objectifs stratégiques et de leur niveau d'atteinte.;Qualité;dwh;confidentiel;[Pilotage direction];Sylvain Rauch;Quotidien;46111,20149;/QUALITE/TB Direction/1 Objectifs;684;DW_POWERBI_QUALITE;https://powerbi.cfl.lu/reports/powerbi/DW_FOLDER/QUALITE/TB%20Direction/1%20Objectifs
rep-27;2 Ponctualité et continuité;Tableau de bord des indicateurs de ponctualité et de continuité de service.;Qualité;dwh;public;[Pilotage direction, Ponctualité];Sylvain Rauch;Quotidien;46048,90617;/QUALITE/TB Direction/2 Ponctualité et continuité;820;DW_POWERBI_QUALITE;https://powerbi.cfl.lu/reports/powerbi/DW_FOLDER/TB%20Direction/2%20Ponctualité%20et%20continuité
rep-28;2b Ponctualité - Commentaires détaillés;Analyse détaillée et commentaires explicatifs des résultats de ponctualité.;Qualité;dwh;confidentiel;[Pilotage direction, Ponctualité];Gilles Becker;Mensuel;46107,4707;/QUALITE/TB Direction/2b Ponctualité - Commentaires détaillés;260;DW_POWERBI_QUALITE;https://powerbi.cfl.lu/reports/powerbi/DW_FOLDER/QUALITE/TB%20Direction/2b%20Ponctualité%20-%20Commentaires%20détaillés
rep-29;3 Causes de retards et de suppressions - Vue client voyageur;Analyse des retards et suppressions selon leur impact sur les voyageurs.;Qualité;dwh;public;[Ponctualité, Satisfaction client];Sylvain Rauch;Quotidien;46065,61122;/QUALITE/TB Direction/3 Causes de retards et de suppressions - Vue client voyageur;301;DW_POWERBI_QUALITE;https://powerbi.cfl.lu/reports/powerbi/DW_FOLDER/TB%20Direction/3%20Causes%20de%20retards%20et%20de%20suppressions%20-%20Vue%20client%20voyageur
rep-30;4 Ponctualité des trains transfrontaliers;Suivi des performances de ponctualité des trains internationaux.;Qualité;dwh;confidentiel;[Ponctualité, Coopération externe];Sylvain Rauch;Hebdomadaire;46086,66902;/QUALITE/TB Direction/4 Ponctualité des trains transfrontaliers;502;DW_POWERBI_QUALITE;https://powerbi.cfl.lu/reports/powerbi/DW_FOLDER/TB%20Direction/4%20Ponctualité%20des%20trains%20transfrontaliers
rep-31;5 Rapport Commun CFL-SNCB;Rapport partagé entre CFL et SNCB sur les indicateurs communs de performance.;Qualité;dwh;restreint;[Coopération externe, Pilotage direction];Sylvain Rauch;Quotidien;46036,46642;/QUALITE/TB Direction/5 Rapport Commun CFL-SNCB;1287;DW_POWERBI_QUALITE;https://powerbi.cfl.lu/reports/powerbi/DW_FOLDER/QUALITE/TB%20Direction/5%20Rapport%20Commun%20CFL-SNCB
rep-32;6 Correspondances train-train;Analyse de la qualité des correspondances entre trains.;Qualité;dwh;restreint;[Ponctualité, Satisfaction client];Sylvain Rauch;Hebdomadaire;46039,44452;/QUALITE/TB Direction/6 Correspondances train-train;1092;DW_POWERBI_QUALITE;https://powerbi.cfl.lu/reports/powerbi/DW_FOLDER/QUALITE/TB%20Direction/6%20Correspondances%20train-train
rep-33;1 Objectifs 2024;Historique du suivi des objectifs stratégiques pour l'année 2024.;Qualité;dwh;public;[Pilotage direction];Gilles Becker;Quotidien;46186,09696;/QUALITE/TB Direction/Années précédentes/1 Objectifs 2024;170;DW_POWERBI_QUALITE;https://powerbi.cfl.lu/reports/powerbi/DW_FOLDER/QUALITE/TB%20Direction/Années%20précédentes/1%20Objectifs%202024
rep-34;1 Objectifs 2025;Historique du suivi des objectifs stratégiques pour l'année 2025.;Qualité;dwh;public;[Pilotage direction];Sylvain Rauch;Hebdomadaire;46163,0743;/QUALITE/TB Direction/Années précédentes/1 Objectifs 2025;1989;DW_POWERBI_QUALITE;https://powerbi.cfl.lu/reports/powerbi/DW_FOLDER/QUALITE/TB%20Direction/Années%20précédentes/1%20Objectifs%202025
rep-35;Indicateurs info voy basés sur les messages UIC;Suivi des indicateurs d'information voyageurs issus des messages UIC.;Qualité;dwh;interne;[Information voyageurs, Performance opérationnelle];Sylvain Rauch;Hebdomadaire;46190,21106;/QUALITE/TB Opérationnels – Info Voy/Indicateurs info voy basés sur les messages UIC;1654;DW_POWERBI_QUALITE_TBOPERATIONNELS;https://powerbi.cfl.lu/reports/powerbi/DW_FOLDER/QUALITE/TB%20Opérationnels%20–%20Info%20Voy/Indicateurs%20info%20voy%20basés%20sur%20les%20messages%20UIC
rep-36;Info voy app CFL;Analyse de l'information voyageurs diffusée via l'application CFL.;Qualité;dwh;public;[Information voyageurs, Satisfaction client];Sylvain Rauch;Quotidien;46191,54686;/QUALITE/TB Opérationnels – Info Voy/Info voy app CFL;1154;DW_POWERBI_QUALITE_TBOPERATIONNELS;https://powerbi.cfl.lu/reports/powerbi/DW_FOLDER/QUALITE/TB%20Opérationnels%20–%20Info%20Voy/Info%20voy%20app%20CFL
rep-37;Info voy en situation normale;Évaluation de la qualité de l'information voyageurs en exploitation normale.;Qualité;dwh;interne;[Information voyageurs, Performance opérationnelle];Gilles Becker;Mensuel;46034,15417;/QUALITE/TB Opérationnels – Info Voy/Info voy en situation normale;1100;DW_POWERBI_QUALITE_TBOPERATIONNELS;https://powerbi.cfl.lu/reports/powerbi/DW_FOLDER/QUALITE/TB%20Opérationnels%20–%20Info%20Voy/Info%20voy%20en%20situation%20normale
rep-38;Info voy en situation perturbée;Évaluation de la qualité de l'information voyageurs lors des perturbations.;Qualité;dwh;restreint;[Information voyageurs, Performance opérationnelle];Gilles Becker;Mensuel;46176,19528;/QUALITE/TB Opérationnels – Info Voy/Info voy en situation perturbée;1951;DW_POWERBI_QUALITE_TBOPERATIONNELS;https://powerbi.cfl.lu/reports/powerbi/DW_FOLDER/QUALITE/TB%20Opérationnels%20–%20Info%20Voy/Info%20voy%20en%20situation%20perturbée
rep-39;Objectifs EF sur les causes de retards et de suppressions;Suivi des objectifs de l'Entreprise Ferroviaire relatifs aux causes de retards et suppressions.;Qualité;dwh;interne;[Ponctualité, Pilotage direction];Gilles Becker;Mensuel;46133,97229;/QUALITE/TB Opérationnels - Ponctualité/Objectifs EF sur les causes de retards et de suppressions;690;DW_POWERBI_QUALITE_TBOPERATIONNELS;https://powerbi.cfl.lu/reports/powerbi/DW_FOLDER/QUALITE/TB%20Opérationnels%20-%20Ponctualité/Objectifs%20EF%20sur%20les%20causes%20de%20retards%20et%20de%20suppressions
rep-40;Objectifs GI sur les causes de retards et de suppressions;Suivi des objectifs du Gestionnaire d'Infrastructure relatifs aux causes de retards et suppressions.;Qualité;dwh;restreint;[Ponctualité, Infrastructure];Gilles Becker;Mensuel;46214,17105;/QUALITE/TB Opérationnels - Ponctualité/Objectifs GI sur les causes de retards et de suppressions;265;DW_POWERBI_QUALITE_TBOPERATIONNELS;https://powerbi.cfl.lu/reports/powerbi/DW_FOLDER/QUALITE/TB%20Opérationnels%20-%20Ponctualité/Objectifs%20GI%20sur%20les%20causes%20de%20retards%20et%20de%20suppressions
rep-41;Rapport hebdomadaire sur les codes causes;Analyse hebdomadaire de la répartition des causes de retards et suppressions.;Qualité;dwh;restreint;[Ponctualité, Performance opérationnelle];Sylvain Rauch;Hebdomadaire;46181,15494;/QUALITE/TB Opérationnels - Ponctualité/Rapport hebdomadaire sur les codes causes;1116;DW_POWERBI_QUALITE_TBOPERATIONNELS;https://powerbi.cfl.lu/reports/powerbi/DW_FOLDER/QUALITE/TB%20Opérationnels%20-%20Ponctualité/Rapport%20hebdomadaire%20sur%20les%20codes%20causes
rep-42;Analyse des périodes de travaux;Étude de l'impact des périodes de travaux sur l'exploitation ferroviaire et la qualité de service.;Qualité;dwh;restreint;[Infrastructure, Performance opérationnelle];Sylvain Rauch;Quotidien;46180,19542;/QUALITE/Travaux/Analyse des périodes de travaux;803;DW_POWERBI_QUALITE;https://powerbi.cfl.lu/reports/powerbi/DW_FOLDER/QUALITE/Travaux/Analyse%20des%20périodes%20de%20travaux
rep-43;Suivi plateforme BI;Suivi des droits et accès sur la plateforme BI, et gestion des incohérences des droits;Informatique;dwh;restreint;[Informatique, Dashbaord];Stephane Hoff;Quotidien;46169,87032;/SUIVI PLATEFORME BI/Suivi plateforme BI;2524;DW_POWERBI_CONTENT_MANAGERS_PROD;https://powerbi.cfl.lu/reports/powerbi/DW_FOLDER/SUIVI%20PLATEFORME%20BI/Suivi%20plateforme%20BI
rep-44;Revue des accès Teams et SharePoint 2026 - DM Maison Mère;Rapport de suivi de projet sur la revue des Teams et Sharepoint;Informatique;dwh;restreint;[Informatique, Dashbaord];Pauline Bouard;Hebdomadaire;46111,20149;/Data Gouvernance/Revue des accès/Data Manager;718;DW_POWERBI_CONTENT_MANAGERS_PROD;https://powerbi.cfl.lu/reports/powerbi/DW_FOLDER/Data%20Gouvernance/Revue%20des%20acc%C3%A8s/Data%20Manager/Revue%20des%20acc%C3%A8s%20Teams%20et%20SharePoint%202026%20-%20DM%20Maison%20M%C3%A8re`;

// Parse CSV Reports to Object Array
function parseCSVReports(csvText) {
    const lines = csvText.trim().split("\n");
    const reportsList = [];
    
    // Excel serial date to JS string helper
    const excelDateToStr = (serialStr) => {
        try {
            const serial = parseFloat(serialStr.replace(",", "."));
            // Dec 30, 1899 + serial days
            const date = new Date((serial - 25569) * 86400 * 1000);
            
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            
            return `${day}/${month}/${year} à ${hours}:${minutes}`;
        } catch (e) {
            return "Récemment";
        }
    };

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === "") continue;

        const parts = line.split(";");
        if (parts.length < 14) continue;

        const id = parts[0];
        const title = parts[1];
        const desc = parts[2];
        // Strip accents and lowercase the service to match CSS badges (Qualité -> qualite, Informatique -> informatique)
        const service = parts[3].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const classification = parts[4];
        const pssi = parts[5];
        
        // Robust tags parser splitting bracketed comma-separated strings [tag1, tag2]
        let tags = [];
        let tagsRaw = parts[6].trim();
        // Remove outer quotes if present
        if (tagsRaw.startsWith('"') && tagsRaw.endsWith('"')) {
            tagsRaw = tagsRaw.slice(1, -1);
        }
        // Remove brackets
        if (tagsRaw.startsWith('[') && tagsRaw.endsWith(']')) {
            tagsRaw = tagsRaw.slice(1, -1);
        }
        // Split by comma and clean up double-quotes or remaining spaces
        tags = tagsRaw.split(",")
            .map(t => t.trim().replace(/^["']|["']$/g, "").replace(/""/g, "").replace(/"/g, ""))
            .filter(t => t !== "");

        const owner = parts[7];
        const frequency = parts[8];
        const lastRefresh = excelDateToStr(parts[9]);
        const pbirsPath = parts[10];
        const viewCount = parseInt(parts[11]) || 0;
        const adGroups = [parts[12]];
        const pbirsUrl = parts[13];

        reportsList.push({
            id,
            title,
            desc,
            service,
            classification,
            pssi,
            tags,
            owner,
            frequency,
            lastRefresh,
            pbirsPath,
            viewCount,
            adGroups,
            pbirsUrl
        });
    }
    return reportsList;
}

// Audit logs base adjusted for Qualité / Informatique reports
const INITIAL_LOGS = [
    { timestamp: "2026-07-24 10:10", user: "Damien G.", event: "Sync Data Galaxy", target: "Clearing Code 5XX", status: "Succès" },
    { timestamp: "2026-07-24 09:32", user: "Sophie M.", event: "Workflow Partage", target: "Tableau de bord H00 -> L.Faber", status: "Approuvé" },
    { timestamp: "2026-07-24 08:15", user: "Marc W.", event: "Modif. Métadonnées", target: "Qualité des données", status: "Succès" },
    { timestamp: "2026-07-24 07:05", user: "System", event: "Auto-sync Data Galaxy", target: "18 tags synchronisés", status: "Succès" }
];

// Initial sharing workflows in queue
const INITIAL_WORKFLOWS = [
    {
        id: "wf-1",
        timestamp: "2026-07-24 09:15",
        requester: "Damien G.",
        beneficiary: "Laurent Faber (Laurent.Faber@cfl.lu)",
        reportId: "rep-12",
        reportTitle: "Tableau de bord H00",
        reason: "Besoin de suivre les KPIs de ponctualité pour le comité H00 hebdomadaire.",
        workflowType: "direct"
    },
    {
        id: "wf-2",
        timestamp: "2026-07-24 08:30",
        requester: "Marc W.",
        beneficiary: "Jean-Paul Weber (Jean-Paul.Weber@cfl.lu)",
        reportId: "rep-18",
        reportTitle: "Qualité des données",
        reason: "Audit de conformité des heures saisies dans BVU.",
        workflowType: "double"
    }
];

// 2. Global State Variables and Configuration
const DEFAULT_CONFIG = {
    services: [
        { id: "qualite", label: "Qualité", color: "#00a896" },
        { id: "informatique", label: "Informatique", color: "#536dfe" }
    ],
    classifications: [
        { id: "dwh", label: "Certifié DWH", class: "dwh" },
        { id: "self-service", label: "Self-Service", class: "self-service" },
        { id: "public", label: "Public", class: "public" }
    ],
    pssi: [
        { id: "public", label: "Public", class: "public" },
        { id: "interne", label: "Interne", class: "interne" },
        { id: "restreint", label: "Restreint", class: "restreint" },
        { id: "confidentiel", label: "Confidentiel", class: "confidentiel" }
    ]
};

let portalConfig = { ...DEFAULT_CONFIG };
let reports = [];
let logs = [];
let pendingWorkflows = [];
let currentRole = "Standard"; // Standard, Steward, Owner, Admin
let activeTab = "dashboard"; // dashboard, catalog, workflows, governance
let selectedService = "all";
let selectedClassification = "all";
let selectedPssi = "all"; 
let selectedTags = [];
let searchQuery = "";
let favorites = [];
let history = [];

// Helper to convert hex color to rgba for style injection
function hexToRgba(hex, alpha) {
    hex = hex.replace('#', '');
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Dynamically inject styles based on config services
function injectDynamicConfigStyles(config) {
    const styleEl = document.createElement("style");
    let css = "";
    config.services.forEach(s => {
        const rbgLight = hexToRgba(s.color, 0.08);
        css += `
            .service-badge.${s.id} {
                background-color: ${rbgLight} !important;
                color: ${s.color} !important;
            }
            .catalog-service-title.${s.id} {
                border-bottom-color: ${s.color} !important;
            }
        `;
    });
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
}

// Parse custom lightweight YAML
function parseYamlConfig(yamlText) {
    const lines = yamlText.split('\n');
    const config = { services: [], classifications: [], pssi: [] };
    let currentSection = null;
    let currentItem = null;

    for (let line of lines) {
        const trimmed = line.trim();
        if (trimmed === "" || trimmed.startsWith("#")) continue;

        if (trimmed.startsWith("services:")) {
            currentSection = "services";
            continue;
        } else if (trimmed.startsWith("classifications:")) {
            currentSection = "classifications";
            continue;
        } else if (trimmed.startsWith("pssi:")) {
            currentSection = "pssi";
            continue;
        }

        if (trimmed.startsWith("-")) {
            if (currentItem && currentSection) {
                config[currentSection].push(currentItem);
            }
            currentItem = {};
        }

        if (trimmed.includes(":")) {
            const colonIdx = trimmed.indexOf(":");
            let key = trimmed.substring(0, colonIdx).replace(/^-/, "").trim();
            let val = trimmed.substring(colonIdx + 1).trim();
            val = val.replace(/^["']|["']$/g, "");
            
            if (currentItem) {
                currentItem[key] = val;
            }
        }
    }
    if (currentItem && currentSection) {
        config[currentSection].push(currentItem);
    }
    return config;
}

// Populate HTML dynamic filters and admin form dropdowns
function initDynamicFilters(config) {
    // 1. Service filter pills
    const serviceFilterContainer = document.getElementById("filter-services-container");
    if (serviceFilterContainer) {
        serviceFilterContainer.innerHTML = `<button class="filter-pill active" data-service="all">Tous</button>`;
        config.services.forEach(s => {
            const btn = document.createElement("button");
            btn.className = "filter-pill";
            btn.setAttribute("data-service", s.id);
            btn.textContent = s.label;
            serviceFilterContainer.appendChild(btn);
        });
        
        // Rebind click listeners
        document.querySelectorAll('#filter-services-container .filter-pill').forEach(pill => {
            pill.addEventListener("click", (e) => {
                document.querySelectorAll('#filter-services-container .filter-pill').forEach(p => p.classList.remove('active'));
                e.currentTarget.classList.add('active');
                selectedService = e.currentTarget.getAttribute("data-service");
                renderCatalog();
            });
        });
    }

    // 2. Classification filter pills
    const classifFilterContainer = document.getElementById("filter-classifications-container");
    if (classifFilterContainer) {
        classifFilterContainer.innerHTML = `<button class="filter-pill active" data-classif="all">Toutes</button>`;
        config.classifications.forEach(c => {
            const btn = document.createElement("button");
            btn.className = "filter-pill";
            btn.setAttribute("data-classif", c.id);
            btn.textContent = c.label;
            classifFilterContainer.appendChild(btn);
        });
        
        document.querySelectorAll('#filter-classifications-container .filter-pill').forEach(pill => {
            pill.addEventListener("click", (e) => {
                document.querySelectorAll('#filter-classifications-container .filter-pill').forEach(p => p.classList.remove('active'));
                e.currentTarget.classList.add('active');
                selectedClassification = e.currentTarget.getAttribute("data-classif");
                renderCatalog();
            });
        });
    }

    // 3. PSSI filter pills
    const pssiFilterContainer = document.getElementById("filter-pssi-container");
    if (pssiFilterContainer) {
        pssiFilterContainer.innerHTML = `<button class="filter-pill active" data-pssi="all">Toutes</button>`;
        config.pssi.forEach(p => {
            const btn = document.createElement("button");
            btn.className = "filter-pill";
            btn.setAttribute("data-pssi", p.id);
            btn.textContent = p.label;
            pssiFilterContainer.appendChild(btn);
        });
        
        document.querySelectorAll('#filter-pssi-container .filter-pill').forEach(pill => {
            pill.addEventListener("click", (e) => {
                document.querySelectorAll('#filter-pssi-container .filter-pill').forEach(p => p.classList.remove('active'));
                e.currentTarget.classList.add('active');
                selectedPssi = e.currentTarget.getAttribute("data-pssi");
                renderCatalog();
            });
        });
    }

    // 4. Admin form options
    const adminServiceSelect = document.getElementById("admin-report-service");
    if (adminServiceSelect) {
        adminServiceSelect.innerHTML = "";
        config.services.forEach(s => {
            const opt = document.createElement("option");
            opt.value = s.id;
            opt.textContent = s.label;
            adminServiceSelect.appendChild(opt);
        });
    }

    const adminClassifSelect = document.getElementById("admin-report-classif");
    if (adminClassifSelect) {
        adminClassifSelect.innerHTML = "";
        config.classifications.forEach(c => {
            const opt = document.createElement("option");
            opt.value = c.id;
            opt.textContent = c.label;
            adminClassifSelect.appendChild(opt);
        });
    }

    const adminPssiSelect = document.getElementById("admin-report-pssi");
    if (adminPssiSelect) {
        adminPssiSelect.innerHTML = "";
        config.pssi.forEach(p => {
            const opt = document.createElement("option");
            opt.value = p.id;
            opt.textContent = p.label;
            adminPssiSelect.appendChild(opt);
        });
    }
}

// Fetch and load YAML config
async function loadConfig() {
    try {
        const response = await fetch('config.yaml');
        if (response.ok) {
            const yamlText = await response.text();
            portalConfig = parseYamlConfig(yamlText);
            console.log("Configuration YAML chargée avec succès !");
        }
    } catch (e) {
        console.warn("Impossible de charger config.yaml via fetch, utilisation des configurations par défaut.");
    }
    
    injectDynamicConfigStyles(portalConfig);
    initDynamicFilters(portalConfig);
}

// Update Role-Based Tab Permissions
function updateTabPermissions() {
    const navWorkflows = document.querySelector('[data-tab-target="workflows"]');
    const navGovernance = document.querySelector('[data-tab-target="governance"]');
    const navAdminConsole = document.querySelector('[data-tab-target="admin-console"]');

    // Validation des workflows: Steward, Owner, Admin
    const hasWorkflowsAccess = (currentRole === "Steward" || currentRole === "Owner" || currentRole === "Admin");
    if (navWorkflows) {
        navWorkflows.style.display = hasWorkflowsAccess ? "flex" : "none";
    }

    // Gestion des rapports: Steward, Owner
    const hasGovernanceAccess = (currentRole === "Steward" || currentRole === "Owner");
    if (navGovernance) {
        navGovernance.style.display = hasGovernanceAccess ? "flex" : "none";
    }

    // Console Admin BI: Admin ONLY
    const hasAdminConsoleAccess = (currentRole === "Admin");
    if (navAdminConsole) {
        navAdminConsole.style.display = hasAdminConsoleAccess ? "flex" : "none";
    }

    // Redirect to dashboard if currently on a forbidden tab
    if (activeTab === "workflows" && !hasWorkflowsAccess) {
        switchTab("dashboard");
    }
    if (activeTab === "governance" && !hasGovernanceAccess) {
        switchTab("dashboard");
    }
    if (activeTab === "admin-console" && !hasAdminConsoleAccess) {
        switchTab("dashboard");
    }
}

// 3. Initialize App
document.addEventListener("DOMContentLoaded", async () => {
    await loadConfig();
    loadState();
    initEventListeners();
    renderAll();
});

// 4. State Persistence Helpers
function loadState() {
    const savedReports = localStorage.getItem("cfl_bi_reports");
    if (savedReports) {
        reports = JSON.parse(savedReports);
        // Force refresh if database was not matching simplified tags syntax
        if (reports.length > 0 && reports[0].tags.some(t => t.includes('"') || t.startsWith('['))) {
            reports = parseCSVReports(RAW_CSV_DATA);
            saveReportsToStorage();
        }
    } else {
        reports = parseCSVReports(RAW_CSV_DATA);
        saveReportsToStorage();
    }

    const savedLogs = localStorage.getItem("cfl_bi_logs");
    if (savedLogs) {
        logs = JSON.parse(savedLogs);
    } else {
        logs = [...INITIAL_LOGS];
        saveLogsToStorage();
    }

    const savedWorkflows = localStorage.getItem("cfl_bi_workflows");
    if (savedWorkflows) {
        pendingWorkflows = JSON.parse(savedWorkflows);
    } else {
        pendingWorkflows = [...INITIAL_WORKFLOWS];
        saveWorkflowsToStorage();
    }

    const savedRole = localStorage.getItem("cfl_bi_current_role");
    currentRole = savedRole ? savedRole : "Standard";

    const savedFavs = localStorage.getItem("cfl_bi_favorites");
    favorites = savedFavs ? JSON.parse(savedFavs) : ["rep-12", "rep-18"];
    favorites = favorites.filter(id => reports.some(r => r.id === id));
    if (favorites.length === 0 && reports.length >= 2) {
        favorites = [reports[11].id, reports[17].id]; // rep-12, rep-18
    }

    const savedHist = localStorage.getItem("cfl_bi_history");
    history = savedHist ? JSON.parse(savedHist) : ["rep-12", "rep-9", "rep-21"];
    history = history.filter(id => reports.some(r => r.id === id));
    if (history.length === 0 && reports.length >= 3) {
        history = [reports[11].id, reports[8].id, reports[20].id]; // rep-12, rep-9, rep-21
    }

    // Update Role Selector UI
    setTimeout(() => {
        const selector = document.getElementById("user-role-selector");
        if (selector) {
            selector.value = currentRole;
            updateAvatarIcon();
        }
    }, 50);

    loadRecertifications();
    loadSyncLogs();
}

function saveReportsToStorage() {
    localStorage.setItem("cfl_bi_reports", JSON.stringify(reports));
}

function saveLogsToStorage() {
    localStorage.setItem("cfl_bi_logs", JSON.stringify(logs));
}

function saveWorkflowsToStorage() {
    localStorage.setItem("cfl_bi_workflows", JSON.stringify(pendingWorkflows));
}

function saveFavoritesToStorage() {
    localStorage.setItem("cfl_bi_favorites", JSON.stringify(favorites));
}

function saveHistoryToStorage() {
    localStorage.setItem("cfl_bi_history", JSON.stringify(history));
}

function updateAvatarIcon() {
    const avatar = document.getElementById("user-avatar");
    if (!avatar) return;
    switch (currentRole) {
        case "Steward": avatar.textContent = "DS"; break;
        case "Owner": avatar.textContent = "BO"; break;
        case "Admin": avatar.textContent = "AB"; break;
        default: avatar.textContent = "DG"; break;
    }
}

// 5. DOM Event Listeners binding
function initEventListeners() {
    // Toggle Data Galaxy sync status simulation
    const dgBadge = document.getElementById("header-datagalaxy-badge");
    if (dgBadge) {
        dgBadge.addEventListener("click", () => {
            const dot = document.getElementById("header-dg-status-dot");
            const text = document.getElementById("header-dg-status-text");
            if (dot.classList.contains("error")) {
                dot.classList.remove("error");
                text.textContent = "Synchronisé";
                dgBadge.setAttribute("title", "Cliquez pour simuler une erreur de synchronisation Data Galaxy");
            } else {
                dot.classList.add("error");
                text.textContent = "Erreur";
                dgBadge.setAttribute("title", "Cliquez pour reconnecter à Data Galaxy");
            }
        });
    }

    // Tabs selection in sidebar
    document.querySelectorAll('#nav-prototype-group .nav-item').forEach(item => {
        item.addEventListener("click", (e) => {
            const tabId = e.currentTarget.getAttribute("data-tab-target");
            switchTab(tabId);
        });
    });

    // Role Switcher Simulator
    const roleSelector = document.getElementById("user-role-selector");
    if (roleSelector) {
        roleSelector.addEventListener("change", (e) => {
            currentRole = e.target.value;
            localStorage.setItem("cfl_bi_current_role", currentRole);
            updateAvatarIcon();
            
            // Refresh details drawer if open (permissions changes layout)
            const drawer = document.getElementById("report-drawer");
            if (drawer && drawer.classList.contains("open")) {
                const favBtn = document.getElementById("drawer-fav-action-btn");
                if (favBtn) {
                    const activeId = favBtn.getAttribute("data-report-id");
                    openDrawer(activeId);
                }
            }

            renderAll();
        });
    }

    // Collapsible cards toggle listeners
    const recertToggle = document.getElementById("recert-toggle-header");
    if (recertToggle) {
        recertToggle.addEventListener("click", () => {
            const content = document.getElementById("recert-collapse-content");
            const arrow = recertToggle.querySelector(".toggle-arrow");
            if (content.style.display === "none") {
                content.style.display = "block";
                arrow.style.transform = "rotate(0deg)";
            } else {
                content.style.display = "none";
                arrow.style.transform = "rotate(-90deg)";
            }
        });
    }

    // Anomaly Bug report triggers
    const bugBtn = document.getElementById("viewer-bug-report-btn");
    if (bugBtn) bugBtn.addEventListener("click", openBugReportModal);

    const bugClose = document.getElementById("bug-close-btn");
    const bugCancel = document.getElementById("bug-cancel-btn");
    if (bugClose) bugClose.addEventListener("click", closeBugReportModal);
    if (bugCancel) bugCancel.addEventListener("click", closeBugReportModal);

    const bugSubmit = document.getElementById("bug-submit-btn");
    if (bugSubmit) bugSubmit.addEventListener("click", submitBugReport);

    // Recertify modal triggers
    const recertClose = document.getElementById("recert-close-btn");
    const recertCancel = document.getElementById("recert-cancel-btn");
    if (recertClose) recertClose.addEventListener("click", closeRecertifyModal);
    if (recertCancel) recertCancel.addEventListener("click", closeRecertifyModal);

    const recertSubmit = document.getElementById("recert-submit-btn");
    if (recertSubmit) recertSubmit.addEventListener("click", submitRecertification);

    // Manual sync trigger
    const syncBtn = document.getElementById("admin-sync-now-btn");
    if (syncBtn) syncBtn.addEventListener("click", forceManualSync);

    // Collapsible cards toggle listeners
    const wfToggle = document.getElementById("wf-toggle-header");
    if (wfToggle) {
        wfToggle.addEventListener("click", () => {
            const content = document.getElementById("wf-collapse-content");
            const arrow = wfToggle.querySelector(".toggle-arrow");
            if (content.style.display === "none") {
                content.style.display = "block";
                arrow.style.transform = "rotate(0deg)";
            } else {
                content.style.display = "none";
                arrow.style.transform = "rotate(-90deg)";
            }
        });
    }

    const logsToggle = document.getElementById("logs-toggle-header");
    if (logsToggle) {
        logsToggle.addEventListener("click", () => {
            const content = document.getElementById("logs-collapse-content");
            const arrow = logsToggle.querySelector(".toggle-arrow");
            if (content.style.display === "none") {
                content.style.display = "block";
                arrow.style.transform = "rotate(0deg)";
            } else {
                content.style.display = "none";
                arrow.style.transform = "rotate(-90deg)";
            }
        });
    }

    // Dashboard Links
    document.querySelectorAll('[data-go-to]').forEach(link => {
        link.addEventListener("click", (e) => {
            const targetTab = e.currentTarget.getAttribute("data-go-to");
            const filterType = e.currentTarget.getAttribute("data-filter");
            
            switchTab(targetTab);
            if (filterType === "favorites") {
                searchQuery = "";
                selectedService = "all";
                selectedClassification = "all";
                selectedPssi = "all";
                document.getElementById("catalog-search").value = "";
                filterCatalogByFavorites();
            }
        });
    });

    // Catalog Search
    const searchInput = document.getElementById("catalog-search");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            searchQuery = e.target.value;
            renderCatalog();
        });
    }

    // Service Filters
    document.querySelectorAll('#filter-services-container .filter-pill').forEach(pill => {
        pill.addEventListener("click", (e) => {
            document.querySelectorAll('#filter-services-container .filter-pill').forEach(p => p.classList.remove('active'));
            e.currentTarget.classList.add('active');
            selectedService = e.currentTarget.getAttribute("data-service");
            renderCatalog();
        });
    });

    // Classification Filters
    document.querySelectorAll('#filter-classifications-container .filter-pill').forEach(pill => {
        pill.addEventListener("click", (e) => {
            document.querySelectorAll('#filter-classifications-container .filter-pill').forEach(p => p.classList.remove('active'));
            e.currentTarget.classList.add('active');
            selectedClassification = e.currentTarget.getAttribute("data-classif");
            renderCatalog();
        });
    });

    // PSSI Sensitivity Filters
    document.querySelectorAll('#filter-pssi-container .filter-pill').forEach(pill => {
        pill.addEventListener("click", (e) => {
            document.querySelectorAll('#filter-pssi-container .filter-pill').forEach(p => p.classList.remove('active'));
            e.currentTarget.classList.add('active');
            selectedPssi = e.currentTarget.getAttribute("data-pssi");
            renderCatalog();
        });
    });

    // Clear Filters Button
    const clearFiltersBtn = document.getElementById("clear-filters-btn");
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener("click", clearCatalogFilters);
    }

    // Drawer Close Buttons
    const drawerClose = document.getElementById("drawer-close-btn");
    const drawerOverlay = document.getElementById("drawer-overlay");
    if (drawerClose) drawerClose.addEventListener("click", closeDrawer);
    if (drawerOverlay) {
        drawerOverlay.addEventListener("click", () => {
            closeDrawer();
            closeReportViewer();
        });
    }

    // Favorite button inside Drawer
    const drawerFavBtn = document.getElementById("drawer-fav-action-btn");
    if (drawerFavBtn) {
        drawerFavBtn.addEventListener("click", () => {
            const reportId = drawerFavBtn.getAttribute("data-report-id");
            toggleFavorite(reportId);
            updateDrawerFavButton(reportId);
        });
    }

    // Share button inside Drawer -> Open Modal
    const drawerShareBtn = document.getElementById("drawer-share-action-btn");
    if (drawerShareBtn) {
        drawerShareBtn.addEventListener("click", () => {
            const reportId = drawerFavBtn.getAttribute("data-report-id");
            openShareModal(reportId);
        });
    }

    // Direct Report Viewer Triggers
    const openReportBtn = document.getElementById("drawer-open-report-btn");
    if (openReportBtn) {
        openReportBtn.addEventListener("click", (e) => {
            e.preventDefault();
            const reportId = drawerFavBtn.getAttribute("data-report-id");
            openReportViewer(reportId);
        });
    }

    const viewerBackBtn = document.getElementById("viewer-back-btn");
    if (viewerBackBtn) {
        viewerBackBtn.addEventListener("click", closeReportViewer);
    }

    // Power BI Sidebar navigation inside viewer
    document.querySelectorAll('.viewer-sidebar .viewer-page-item').forEach(item => {
        item.addEventListener("click", (e) => {
            document.querySelectorAll('.viewer-sidebar .viewer-page-item').forEach(p => p.classList.remove('active'));
            e.currentTarget.classList.add('active');
            
            const targetPage = e.currentTarget.getAttribute("data-page");
            document.querySelectorAll('.viewer-canvas .sim-page').forEach(page => page.classList.remove('active'));
            const targetPageEl = document.getElementById(`sim-${targetPage}`);
            if (targetPageEl) targetPageEl.classList.add('active');
        });
    });

    // Copy integration URL button
    const copyUrlBtn = document.getElementById("viewer-copy-url-btn");
    if (copyUrlBtn) {
        copyUrlBtn.addEventListener("click", () => {
            const urlText = document.getElementById("viewer-display-url").textContent;
            navigator.clipboard.writeText(urlText).then(() => {
                const prevText = copyUrlBtn.textContent;
                copyUrlBtn.textContent = "Copié !";
                copyUrlBtn.style.backgroundColor = "#34c759";
                copyUrlBtn.style.color = "#ffffff";
                setTimeout(() => {
                    copyUrlBtn.textContent = prevText;
                    copyUrlBtn.style.backgroundColor = "";
                    copyUrlBtn.style.color = "";
                }, 2000);
            }).catch(err => {
                alert("Erreur lors de la copie de l'URL : " + err);
            });
        });
    }

    // Toggle simulator view button
    const toggleSimBtn = document.getElementById("viewer-toggle-simulator-btn");
    if (toggleSimBtn) {
        toggleSimBtn.addEventListener("click", () => {
            const simulator = document.getElementById("fallback-report-simulator");
            const iframe = document.getElementById("report-iframe");
            if (simulator.style.display === "none") {
                simulator.style.display = "block";
                iframe.style.opacity = "0.1";
                toggleSimBtn.textContent = "Revenir à l'iframe en direct";
                toggleSimBtn.style.backgroundColor = "#fff3cd";
                toggleSimBtn.style.color = "#856404";
            } else {
                simulator.style.display = "none";
                iframe.style.opacity = "1";
                toggleSimBtn.textContent = "Utiliser le simulateur offline";
                toggleSimBtn.style.backgroundColor = "";
                toggleSimBtn.style.color = "";
            }
        });
    }

    // Modal Close
    const modalCloseBtn = document.getElementById("modal-close-btn");
    const modalCancelBtn = document.getElementById("share-cancel-btn");
    if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeShareModal);
    if (modalCancelBtn) modalCancelBtn.addEventListener("click", closeShareModal);

    // Modal Submit
    const modalSubmitBtn = document.getElementById("share-submit-btn");
    if (modalSubmitBtn) {
        modalSubmitBtn.addEventListener("click", submitShareWorkflow);
    }

    // Administration Form
    const adminSelect = document.getElementById("admin-select-report");
    if (adminSelect) {
        adminSelect.addEventListener("change", (e) => {
            loadReportInAdminForm(e.target.value);
        });
    }

    const adminSaveBtn = document.getElementById("admin-save-btn");
    if (adminSaveBtn) {
        adminSaveBtn.addEventListener("click", saveReportMetadataFromAdmin);
    }

    const adminCancelBtn = document.getElementById("admin-cancel-btn");
    if (adminCancelBtn) {
        adminCancelBtn.addEventListener("click", () => {
            if (adminSelect) loadReportInAdminForm(adminSelect.value);
        });
    }
}

function switchTab(tabId) {
    activeTab = tabId;
    
    document.querySelectorAll('#nav-prototype-group .nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute("data-tab-target") === tabId) {
            item.classList.add('active');
        }
    });

    document.getElementById("section-dashboard").classList.remove("active");
    document.getElementById("section-catalog").classList.remove("active");
    document.getElementById("section-workflows").classList.remove("active");
    document.getElementById("section-governance").classList.remove("active");
    
    const adminSec = document.getElementById("section-admin-console");
    if (adminSec) {
        adminSec.classList.remove("active");
    }

    const targetSection = document.getElementById(`section-${tabId}`);
    if (targetSection) {
        targetSection.classList.add("active");
    }

    if (tabId === "dashboard") {
        renderDashboard();
    } else if (tabId === "catalog") {
        renderCatalog();
    } else if (tabId === "workflows") {
        renderWorkflowsTab();
    } else if (tabId === "governance") {
        renderAdminPanel();
    } else if (tabId === "admin-console") {
        renderAdminConsole();
    }
}

// 6. Rendering Engine
function renderAll() {
    updateTabPermissions();
    renderDashboard();
    renderCatalog();
    renderWorkflowsTab();
    renderAdminPanel();
    if (currentRole === "Admin") {
        renderAdminConsole();
    }
}

// --- DASHBOARD RENDERING ---
function renderDashboard() {
    document.getElementById("kpi-total-reports").textContent = reports.length;
    
    const certifiedReports = reports.filter(r => r.classification === "dwh");
    document.getElementById("kpi-total-certified").textContent = certifiedReports.length;
    
    document.getElementById("kpi-total-favorites").textContent = favorites.length;
    document.getElementById("kpi-total-workflows").textContent = pendingWorkflows.length;

    // Render Favorites List (Dashboard Panel)
    const favListContainer = document.getElementById("dashboard-favorites-list");
    favListContainer.innerHTML = "";
    
    const favReports = reports.filter(r => favorites.includes(r.id));
    if (favReports.length === 0) {
        favListContainer.innerHTML = `<p class="text-secondary" style="font-size: 14px; font-style: italic; padding: 10px 0;">Vous n'avez aucun rapport en favori. Allez dans le catalogue pour en ajouter.</p>`;
    } else {
        favReports.forEach(r => {
            const classifLabel = r.classification === "dwh" ? "Certifié DWH" : (r.classification === "self-service" ? "Self-Service" : "Public");
            const pssiLabel = r.pssi.toUpperCase();
            const item = document.createElement("div");
            item.className = "list-item-row";
            item.innerHTML = `
                <div class="item-left">
                    <span class="nav-icon" style="color: #ff9500;">
                        <svg class="icon-svg" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.2" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    </span>
                    <div>
                        <span class="item-title">${r.title}</span>
                        <span class="item-meta"> | Classif: <strong>${classifLabel}</strong> | PSSI: <strong style="color:var(--cfl-crimson);">${pssiLabel}</strong></span>
                    </div>
                </div>
                <span class="service-badge ${r.service}">${r.service.toUpperCase()}</span>
            `;
            item.addEventListener("click", () => openDrawer(r.id));
            favListContainer.appendChild(item);
        });
    }

    // Render Popular / Most Viewed List
    const popularContainer = document.getElementById("dashboard-popular-list");
    popularContainer.innerHTML = "";
    
    const popularReports = [...reports].sort((a, b) => b.viewCount - a.viewCount).slice(0, 3);
    popularReports.forEach((r, idx) => {
        const item = document.createElement("div");
        item.className = "list-item-row";
        item.innerHTML = `
            <div class="item-left">
                <span class="item-number">#${idx + 1}</span>
                <div>
                    <span class="item-title">${r.title}</span>
                    <span class="item-meta">${r.viewCount} vues</span>
                </div>
            </div>
            <span class="service-badge ${r.service}">${r.service.toUpperCase()}</span>
        `;
        item.addEventListener("click", () => openDrawer(r.id));
        popularContainer.appendChild(item);
    });

    // Render Recently Viewed History (5 elements as requested)
    const historyContainer = document.getElementById("dashboard-history-list");
    historyContainer.innerHTML = "";
    
    if (history.length === 0) {
        historyContainer.innerHTML = `<p class="text-secondary" style="font-size: 13px; font-style: italic;">Aucun rapport consulté récemment.</p>`;
    } else {
        const historyReports = history
            .map(id => reports.find(r => r.id === id))
            .filter(r => r !== undefined)
            .reverse()
            .slice(0, 5); // Extended to 5 elements

        historyReports.forEach(r => {
            const item = document.createElement("div");
            item.className = "list-item-row";
            item.innerHTML = `
                <div class="item-left">
                    <span class="nav-icon" style="color: var(--voyageurs-color);">
                        <svg class="icon-svg" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.2" fill="none"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    </span>
                    <span class="item-title">${r.title}</span>
                </div>
                <span class="item-meta">PSSI: <strong>${r.pssi.toUpperCase()}</strong></span>
            `;
            item.addEventListener("click", () => openDrawer(r.id));
            historyContainer.appendChild(item);
        });
    }
}

// --- CATALOGUE RENDERING ---
function renderCatalog() {
    const tagsContainer = document.getElementById("filter-tags-container");
    const allTags = new Set();
    reports.forEach(r => r.tags.forEach(t => allTags.add(t)));
    
    const prevSelectedTags = [...selectedTags];
    tagsContainer.innerHTML = "";
    
    allTags.forEach(tag => {
        const isActive = prevSelectedTags.includes(tag);
        const pill = document.createElement("button");
        pill.className = `filter-pill ${isActive ? 'active' : ''}`;
        pill.textContent = tag;
        pill.addEventListener("click", () => toggleTagFilter(tag));
        tagsContainer.appendChild(pill);
    });

    const grid = document.getElementById("catalog-reports-grid");
    grid.innerHTML = "";

    let filteredReports = reports.filter(r => {
        if (selectedService !== "all" && r.service !== selectedService) {
            return false;
        }

        if (selectedClassification !== "all" && r.classification !== selectedClassification) {
            return false;
        }

        if (selectedPssi !== "all" && r.pssi !== selectedPssi) {
            return false;
        }

        if (selectedTags.length > 0) {
            const hasAllTags = selectedTags.every(tag => r.tags.includes(tag));
            if (!hasAllTags) return false;
        }

        if (searchQuery.trim() !== "") {
            const q = searchQuery.toLowerCase();
            const matchTitle = r.title.toLowerCase().includes(q);
            const matchDesc = r.desc.toLowerCase().includes(q);
            const matchOwner = r.owner.toLowerCase().includes(q);
            const matchTags = r.tags.some(tag => tag.toLowerCase().includes(q));
            const matchService = r.service.toLowerCase().includes(q);
            
            if (!matchTitle && !matchDesc && !matchOwner && !matchTags && !matchService) {
                return false;
            }
        }

        return true;
    });

    const activeFiltersInfo = document.getElementById("active-filters-info");
    const activeFiltersText = document.getElementById("active-filters-text");
    
    let activeFiltersList = [];
    if (selectedService !== "all") activeFiltersList.push(`Service: ${selectedService.toUpperCase()}`);
    if (selectedClassification !== "all") {
        const classifLabel = selectedClassification === "dwh" ? "Certifié DWH" : (selectedClassification === "self-service" ? "Self-Service" : "Public");
        activeFiltersList.push(`Classif: ${classifLabel}`);
    }
    if (selectedPssi !== "all") {
        activeFiltersList.push(`PSSI: ${selectedPssi.toUpperCase()}`);
    }
    if (selectedTags.length > 0) activeFiltersList.push(`Tags: [${selectedTags.join(', ')}]`);
    if (searchQuery.trim() !== "") activeFiltersList.push(`Recherche: "${searchQuery}"`);
    
    if (activeFiltersList.length > 0 && activeFiltersInfo) {
        activeFiltersInfo.style.display = "block";
        activeFiltersText.textContent = activeFiltersList.join(" | ");
    } else if (activeFiltersInfo) {
        activeFiltersInfo.style.display = "none";
    }

    if (filteredReports.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <div class="empty-state-title">Aucun rapport trouvé</div>
                <p class="text-secondary" style="font-size: 14px;">Ajustez vos filtres ou modifiez votre requête de recherche.</p>
            </div>
        `;
        return;
    }

    // Dynamic View by service (Grouped Layout dynamically populated from config)
    if (selectedService === "all") {
        const services = {};
        portalConfig.services.forEach(s => {
            services[s.id] = { label: `Service ${s.label}`, color: s.id, list: [] };
        });

        filteredReports.forEach(r => {
            if (services[r.service]) {
                services[r.service].list.push(r);
            }
        });

        Object.keys(services).forEach(key => {
            const group = services[key];
            if (group.list.length === 0) return;

            const section = document.createElement("div");
            section.className = "catalog-service-section";
            section.innerHTML = `
                <div class="catalog-service-title ${group.color}">
                    <span>${group.label}</span>
                    <span class="tag-badge" style="font-size: 11px; padding: 2px 8px; border-radius: 10px; background-color: var(--cfl-gray-light); color: var(--text-secondary);">${group.list.length}</span>
                </div>
                <div class="reports-grid" id="service-grid-${key}"></div>
            `;
            grid.appendChild(section);

            const sectionGrid = section.querySelector(`#service-grid-${key}`);
            group.list.forEach(r => {
                const card = createReportCardDOM(r);
                sectionGrid.appendChild(card);
            });
        });
    } else {
        const singleGrid = document.createElement("div");
        singleGrid.className = "reports-grid";
        grid.appendChild(singleGrid);

        filteredReports.forEach(r => {
            const card = createReportCardDOM(r);
            singleGrid.appendChild(card);
        });
    }
}

function createReportCardDOM(r) {
    const isFav = favorites.includes(r.id);
    const classifLabel = r.classification === "dwh" ? "Certifié DWH" : (r.classification === "self-service" ? "Self-Service" : "Public");
    const classifClass = r.classification;
    const pssiLabel = `PSSI: ${r.pssi.toUpperCase()}`;
    const pssiClass = r.pssi;
    
    const card = document.createElement("div");
    card.className = "report-card";
    card.innerHTML = `
        <div class="report-header">
            <div class="report-title-area">
                <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom: 6px;">
                    <span class="classif-badge ${classifClass}" style="padding: 2px 6px; font-size: 9px;">${classifLabel}</span>
                    <span class="pssi-badge ${pssiClass}" style="padding: 2px 6px; font-size: 9px;">${pssiLabel}</span>
                </div>
                <span class="report-card-title">${r.title}</span>
            </div>
            <button class="fav-btn ${isFav ? 'active' : ''}" data-report-id="${r.id}" aria-label="Favori">
                ${isFav ? '★' : '☆'}
            </button>
        </div>
        <p class="report-card-desc">${r.desc}</p>
        <div class="report-meta-row">
            <span class="service-badge ${r.service}">${r.service.toUpperCase()}</span>
            <div class="card-tags">
                ${r.tags.map(t => `<span class="tag-badge">${t}</span>`).join('')}
            </div>
        </div>
    `;
    
    card.addEventListener("click", (e) => {
        if (e.target.classList.contains("fav-btn")) {
            e.stopPropagation();
            toggleFavorite(r.id);
            return;
        }
        openDrawer(r.id);
    });
    
    return card;
}

function filterCatalogByFavorites() {
    selectedService = "all";
    selectedClassification = "all";
    selectedPssi = "all";
    selectedTags = [];
    searchQuery = "";
    
    document.querySelectorAll('#filter-services-container .filter-pill').forEach(p => p.classList.remove('active'));
    document.querySelector('#filter-services-container [data-service="all"]').classList.add('active');

    document.querySelectorAll('#filter-classifications-container .filter-pill').forEach(p => p.classList.remove('active'));
    document.querySelector('#filter-classifications-container [data-classif="all"]').classList.add('active');

    document.querySelectorAll('#filter-pssi-container .filter-pill').forEach(p => p.classList.remove('active'));
    document.querySelector('#filter-pssi-container [data-pssi="all"]').classList.add('active');
    
    const grid = document.getElementById("catalog-reports-grid");
    grid.innerHTML = "";
    
    const filteredReports = reports.filter(r => favorites.includes(r.id));
    
    const activeFiltersInfo = document.getElementById("active-filters-info");
    const activeFiltersText = document.getElementById("active-filters-text");
    if (activeFiltersInfo) {
        activeFiltersInfo.style.display = "block";
        activeFiltersText.textContent = "Filtré par : Favoris";
    }

    if (filteredReports.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⭐</div>
                <div class="empty-state-title">Aucun favori</div>
                <p class="text-secondary" style="font-size: 14px;">Ajoutez des favoris en cliquant sur l'étoile d'un rapport dans le catalogue.</p>
            </div>
        `;
    } else {
        const singleGrid = document.createElement("div");
        singleGrid.className = "reports-grid";
        grid.appendChild(singleGrid);

        filteredReports.forEach(r => {
            const card = createReportCardDOM(r);
            singleGrid.appendChild(card);
        });
    }
}

function toggleTagFilter(tag) {
    const idx = selectedTags.indexOf(tag);
    if (idx === -1) {
        selectedTags.push(tag);
    } else {
        selectedTags.splice(idx, 1);
    }
    renderCatalog();
}

function clearCatalogFilters() {
    selectedService = "all";
    selectedClassification = "all";
    selectedPssi = "all";
    selectedTags = [];
    searchQuery = "";
    
    const searchInput = document.getElementById("catalog-search");
    if (searchInput) searchInput.value = "";
    
    document.querySelectorAll('#filter-services-container .filter-pill').forEach(p => p.classList.remove('active'));
    const allServBtn = document.querySelector('#filter-services-container [data-service="all"]');
    if (allServBtn) allServBtn.classList.add('active');

    document.querySelectorAll('#filter-classifications-container .filter-pill').forEach(p => p.classList.remove('active'));
    const allClassBtn = document.querySelector('#filter-classifications-container [data-classif="all"]');
    if (allClassBtn) allClassBtn.classList.add('active');

    document.querySelectorAll('#filter-pssi-container .filter-pill').forEach(p => p.classList.remove('active'));
    const allPssiBtn = document.querySelector('#filter-pssi-container [data-pssi="all"]');
    if (allPssiBtn) allPssiBtn.classList.add('active');
    
    renderCatalog();
}

// --- WORKFLOW VALIDATION RENDERING ---
function renderWorkflowsTab() {
    const tbody = document.getElementById("workflow-requests-tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    // Update workflow KPI counter on dashboard
    const counter = document.getElementById("kpi-total-workflows");
    if (counter) counter.textContent = pendingWorkflows.length;

    if (pendingWorkflows.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: var(--text-secondary); font-style: italic; padding: 30px;">
                    Aucune demande de partage Active Directory en attente de validation.
                </td>
            </tr>
        `;
        return;
    }

    pendingWorkflows.forEach(wf => {
        const tr = document.createElement("tr");
        const circuitLabel = wf.workflowType === "direct" ? "BO uniquement" : "Double Validation";
        tr.innerHTML = `
            <td><strong>${wf.timestamp}</strong></td>
            <td>${wf.requester}</td>
            <td>${wf.beneficiary}</td>
            <td><strong>${wf.reportTitle}</strong></td>
            <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${wf.reason}">${wf.reason}</td>
            <td><span class="tag-badge" style="background-color: var(--cfl-crimson-light); color: var(--cfl-crimson); font-weight:600;">${circuitLabel}</span></td>
            <td style="text-align: center; white-space: nowrap;">
                <button class="btn-approve" onclick="approveWorkflow('${wf.id}')">Approuver</button>
                <button class="btn-reject" onclick="rejectWorkflow('${wf.id}')">Rejeter</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function approveWorkflow(wfId) {
    const idx = pendingWorkflows.findIndex(w => w.id === wfId);
    if (idx === -1) return;

    const wf = pendingWorkflows[idx];
    const r = reports.find(item => item.id === wf.reportId);

    // Simulate appending beneficiary name to AD Habilitations group log
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    const newLog = {
        timestamp: formattedDate,
        user: "Damien G. (Admin)",
        event: "Workflow Partage",
        target: `${r ? r.title : wf.reportTitle} -> ${wf.beneficiary.split(' (')[0]}`,
        status: "Approuvé (AD Synchronisé)"
    };

    logs.unshift(newLog);
    saveLogsToStorage();

    pendingWorkflows.splice(idx, 1);
    saveWorkflowsToStorage();

    renderAll();
    alert(`La demande d'accès pour "${wf.beneficiary}" sur le rapport "${wf.reportTitle}" a été approuvée. L'utilisateur a été ajouté au groupe Active Directory de sécurité.`);
}

function rejectWorkflow(wfId) {
    const idx = pendingWorkflows.findIndex(w => w.id === wfId);
    if (idx === -1) return;

    const wf = pendingWorkflows[idx];
    const r = reports.find(item => item.id === wf.reportId);

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    const newLog = {
        timestamp: formattedDate,
        user: "Damien G. (Admin)",
        event: "Workflow Partage",
        target: `${r ? r.title : wf.reportTitle} -> ${wf.beneficiary.split(' (')[0]}`,
        status: "Rejeté par Admin"
    };

    logs.unshift(newLog);
    saveLogsToStorage();

    pendingWorkflows.splice(idx, 1);
    saveWorkflowsToStorage();

    renderAll();
    alert(`La demande d'accès pour "${wf.beneficiary}" sur le rapport "${wf.reportTitle}" a été rejetée.`);
}

// Expose workflow actions globally
window.approveWorkflow = approveWorkflow;
window.rejectWorkflow = rejectWorkflow;

// --- ADMIN / GESTION DES RAPPORTS TAB RENDERING ---
function renderAdminPanel() {
    const adminSelect = document.getElementById("admin-select-report");
    if (!adminSelect) return;
    
    const prevSelectedValue = adminSelect.value;
    adminSelect.innerHTML = "";

    reports.forEach(r => {
        const opt = document.createElement("option");
        opt.value = r.id;
        opt.textContent = `${r.title} [${r.service.toUpperCase()}]`;
        adminSelect.appendChild(opt);
    });

    if (prevSelectedValue && reports.some(r => r.id === prevSelectedValue)) {
        adminSelect.value = prevSelectedValue;
    } else if (reports.length > 0) {
        adminSelect.value = reports[0].id;
    }

    if (adminSelect.value) {
        loadReportInAdminForm(adminSelect.value);
    }

    const logsTbody = document.getElementById("admin-logs-tbody");
    if (logsTbody) {
        logsTbody.innerHTML = "";
        logs.forEach(log => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${log.timestamp}</strong></td>
                <td>${log.user}</td>
                <td><span style="font-weight:600; color:var(--cfl-gray-dark);">${log.event}</span></td>
                <td>${log.target}</td>
                <td><span style="color:#34c759; font-weight:600;">● ${log.status}</span></td>
            `;
            logsTbody.appendChild(tr);
        });
    }
    renderRecertificationTable();
}

function loadReportInAdminForm(reportId) {
    const r = reports.find(item => item.id === reportId);
    if (!r) return;

    document.getElementById("admin-report-owner").value = r.owner;
    document.getElementById("admin-report-service").value = r.service;
    document.getElementById("admin-report-classif").value = r.classification;
    document.getElementById("admin-report-pssi").value = r.pssi;
    document.getElementById("admin-report-freq").value = r.frequency;
    document.getElementById("admin-report-desc").value = r.desc;
    document.getElementById("admin-report-tags").value = r.tags.join(", ");
}

function saveReportMetadataFromAdmin() {
    const reportId = document.getElementById("admin-select-report").value;
    const rIdx = reports.findIndex(item => item.id === reportId);
    if (rIdx === -1) return;

    const owner = document.getElementById("admin-report-owner").value.trim();
    const service = document.getElementById("admin-report-service").value;
    const classif = document.getElementById("admin-report-classif").value;
    const pssi = document.getElementById("admin-report-pssi").value;
    const freq = document.getElementById("admin-report-freq").value;
    const desc = document.getElementById("admin-report-desc").value.trim();
    
    const rawTags = document.getElementById("admin-report-tags").value;
    const tags = rawTags.split(",")
        .map(t => t.trim())
        .filter(t => t !== "");

    if (owner === "" || desc === "") {
        alert("Veuillez remplir le propriétaire métier et la description.");
        return;
    }

    reports[rIdx].owner = owner;
    reports[rIdx].service = service;
    reports[rIdx].classification = classif;
    reports[rIdx].pssi = pssi;
    reports[rIdx].frequency = freq;
    reports[rIdx].desc = desc;
    reports[rIdx].tags = tags;
    reports[rIdx].lastRefresh = "Modifié à l'instant (Sync Data Galaxy)";

    saveReportsToStorage();

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    
    const newLog = {
        timestamp: formattedDate,
        user: "Damien G.",
        event: "Modif. Métadonnées",
        target: reports[rIdx].title,
        status: "Succès"
    };

    logs.unshift(newLog);
    saveLogsToStorage();

    renderAll();
    
    alert(`Les métadonnées du rapport "${reports[rIdx].title}" ont été enregistrées avec succès.`);
}

// 9. Drawer Actions (Open, Populate, Close)
function openDrawer(reportId) {
    const r = reports.find(item => item.id === reportId);
    if (!r) return;

    r.viewCount += 1;
    saveReportsToStorage();

    const histIdx = history.indexOf(reportId);
    if (histIdx !== -1) {
        history.splice(histIdx, 1);
    }
    history.push(reportId);
    if (history.length > 15) history.shift();
    saveHistoryToStorage();

    const drawerTitle = document.getElementById("drawer-report-title");
    const drawerTitleHeading = document.getElementById("drawer-title-heading");
    const drawerBadge = document.getElementById("drawer-service-badge");
    const drawerClassBadge = document.getElementById("drawer-classification-badge");
    const drawerPssiBadge = document.getElementById("drawer-pssi-badge");
    const drawerDesc = document.getElementById("drawer-description");
    
    const drawerOwner = document.getElementById("drawer-owner");
    const drawerFreq = document.getElementById("drawer-frequency");
    const drawerPath = document.getElementById("drawer-pbirs-path");
    const drawerTags = document.getElementById("drawer-tags-container");
    const drawerAccessList = document.getElementById("drawer-access-list");

    if (drawerTitle) drawerTitle.textContent = "Fiche d'identité Rapport";
    if (drawerTitleHeading) drawerTitleHeading.textContent = r.title;
    
    if (drawerBadge) {
        drawerBadge.className = `service-badge ${r.service}`;
        drawerBadge.textContent = r.service.toUpperCase();
    }

    if (drawerClassBadge) {
        const classifLabel = r.classification === "dwh" ? "Certifié DWH" : (r.classification === "self-service" ? "Self-Service" : "Public");
        drawerClassBadge.className = `classif-badge ${r.classification}`;
        drawerClassBadge.textContent = classifLabel;
    }

    if (drawerPssiBadge) {
        const pssiLabel = `PSSI: ${r.pssi.toUpperCase()}`;
        drawerPssiBadge.className = `pssi-badge ${r.pssi}`;
        drawerPssiBadge.textContent = pssiLabel;
    }

    if (drawerDesc) drawerDesc.textContent = r.desc;
    
    if (drawerOwner) drawerOwner.textContent = r.owner;
    if (drawerFreq) drawerFreq.textContent = r.frequency;
    if (drawerPath) drawerPath.textContent = r.pbirsPath;
    
    if (drawerTags) {
        drawerTags.innerHTML = "";
        r.tags.forEach(t => {
            const span = document.createElement("span");
            span.className = "drawer-tag";
            span.textContent = t;
            drawerTags.appendChild(span);
        });
    }

    if (drawerAccessList) {
        drawerAccessList.innerHTML = "";
        r.adGroups.forEach(grp => {
            const li = document.createElement("li");
            li.className = "access-user-item";
            li.innerHTML = `<span class="access-user-dot"></span> Groupe AD '${grp}'`;
            drawerAccessList.appendChild(li);
        });
    }

    // Populate view count
    const drawerViews = document.getElementById("drawer-viewcount");
    if (drawerViews) drawerViews.textContent = r.viewCount;

    // Role-based visibility rules:
    // "Emplacement technique" and "Accès autorisés" are only visible to Steward, Owner, and Admin.
    // "Partager" button is only accessible to Steward, Owner, and Admin.
    const hasAdvancedAccess = (currentRole === "Steward" || currentRole === "Owner" || currentRole === "Admin");
    
    const pathContainer = document.getElementById("drawer-technical-path-container");
    const accessContainer = document.getElementById("drawer-access-list-container");
    const viewCountContainer = document.getElementById("drawer-viewcount-container");
    const shareBtn = document.getElementById("drawer-share-action-btn");

    if (pathContainer) pathContainer.style.display = hasAdvancedAccess ? "block" : "none";
    if (accessContainer) accessContainer.style.display = hasAdvancedAccess ? "block" : "none";
    if (viewCountContainer) viewCountContainer.style.display = hasAdvancedAccess ? "block" : "none";
    if (shareBtn) shareBtn.style.display = hasAdvancedAccess ? "flex" : "none";

    const favActionBtn = document.getElementById("drawer-fav-action-btn");
    if (favActionBtn) {
        favActionBtn.setAttribute("data-report-id", r.id);
        updateDrawerFavButton(r.id);
    }

    const drawer = document.getElementById("report-drawer");
    const overlay = document.getElementById("drawer-overlay");
    if (drawer) {
        drawer.classList.add("open");
        drawer.setAttribute("aria-hidden", "false");
    }
    if (overlay) overlay.classList.add("open");
}

function updateDrawerFavButton(reportId) {
    const isFav = favorites.includes(reportId);
    const favText = document.getElementById("drawer-fav-text");
    const favIcon = document.getElementById("drawer-fav-icon");
    const favActionBtn = document.getElementById("drawer-fav-action-btn");
    
    if (favText) favText.textContent = isFav ? "Retirer des Favoris" : "Ajouter aux Favoris";
    if (favIcon) favIcon.textContent = isFav ? "★" : "☆";
    
    if (favActionBtn) {
        if (isFav) {
            favActionBtn.style.color = "#ff9500";
            favActionBtn.style.borderColor = "#ff9500";
        } else {
            favActionBtn.style.color = "var(--text-secondary)";
            favActionBtn.style.borderColor = "var(--cfl-gray-border)";
        }
    }
}

function closeDrawer() {
    const drawer = document.getElementById("report-drawer");
    const overlay = document.getElementById("drawer-overlay");
    if (drawer) {
        drawer.classList.remove("open");
        drawer.setAttribute("aria-hidden", "true");
    }
    if (overlay) overlay.classList.remove("open");
    
    renderAll();
}

// 10. Report Viewer Simulator Logic (Direct Visualization)
// Build URL with rs:Embed=true, active filters and user RLS roles
function buildEmbedUrl(r) {
    let embedUrl = r.pbirsUrl;
    
    // Check for query parameters and append rs:Embed=true
    const separator = embedUrl.includes('?') ? '&' : '?';
    embedUrl += `${separator}rs:Embed=true`;
    
    // Construct OData active filters
    let odataFilters = [];
    if (selectedService !== "all") {
        const servName = selectedService === "qualite" ? "Qualité" : "Informatique";
        odataFilters.push(`Service/Name eq '${servName}'`);
    }
    if (selectedClassification !== "all") {
        odataFilters.push(`Classification/Type eq '${selectedClassification}'`);
    }
    if (selectedPssi !== "all") {
        odataFilters.push(`PSSI/Sensitivity eq '${selectedPssi}'`);
    }
    
    if (odataFilters.length > 0) {
        embedUrl += `&$filter=${encodeURIComponent(odataFilters.join(' and '))}`;
    }
    
    // Append RLS simulation parameters
    embedUrl += `&username=damien.g@cfl.lu&roles=${encodeURIComponent(currentRole)}`;
    
    return embedUrl;
}

// 10. Report Viewer Simulator Logic (Direct Visualization)
function openReportViewer(reportId) {
    const r = reports.find(item => item.id === reportId);
    if (!r) return;

    // Log the SSO report access event
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const accessLog = {
        timestamp: formattedDate,
        user: "Damien G.",
        event: "Visualisation Rapport",
        target: r.title,
        status: "Succès (SSO Actif)"
    };
    logs.unshift(accessLog);
    saveLogsToStorage();

    // Populate metadata in report viewer header
    const viewerTitle = document.getElementById("viewer-report-title");
    const viewerClassBadge = document.getElementById("viewer-classif-badge");
    const viewerRefreshDate = document.getElementById("viewer-refresh-date");
    
    if (viewerTitle) viewerTitle.textContent = r.title;
    if (viewerRefreshDate) viewerRefreshDate.textContent = r.lastRefresh;
    
    if (viewerClassBadge) {
        const classifLabel = r.classification === "dwh" ? "Certifié DWH" : (r.classification === "self-service" ? "Self-Service" : "Public");
        viewerClassBadge.className = `classif-badge ${r.classification}`;
        viewerClassBadge.textContent = classifLabel;
    }

    // Build embed URL and update iframe
    const embedUrl = buildEmbedUrl(r);
    const iframeEl = document.getElementById("report-iframe");
    if (iframeEl) iframeEl.src = embedUrl;

    const displayUrlEl = document.getElementById("viewer-display-url");
    if (displayUrlEl) {
        displayUrlEl.textContent = embedUrl;
        displayUrlEl.setAttribute("title", embedUrl);
    }

    // Update status bar RLS & Filters indicators
    const rlsRoleEl = document.getElementById("viewer-rls-role");
    if (rlsRoleEl) rlsRoleEl.textContent = currentRole;

    const filtersIndicator = document.getElementById("viewer-integration-filters");
    let activeFilters = [];
    if (selectedService !== "all") activeFilters.push(`Service: ${selectedService.toUpperCase()}`);
    if (selectedClassification !== "all") {
        const classifLabel = selectedClassification === "dwh" ? "DWH" : "Self-Service";
        activeFilters.push(`Classif: ${classifLabel}`);
    }
    if (selectedPssi !== "all") activeFilters.push(`PSSI: ${selectedPssi.toUpperCase()}`);
    if (searchQuery.trim() !== "") activeFilters.push(`Recherche: "${searchQuery}"`);
    
    if (filtersIndicator) {
        filtersIndicator.textContent = activeFilters.length > 0 ? activeFilters.join(", ") : "Aucun filtre actif";
    }

    // Populate RLS & Filters inside offline simulator fallback
    const simRlsRoleVal = document.getElementById("sim-rls-role-val");
    if (simRlsRoleVal) simRlsRoleVal.textContent = currentRole;

    const simRlsGroupsVal = document.getElementById("sim-rls-groups-val");
    if (simRlsGroupsVal) simRlsGroupsVal.textContent = r.adGroups.join(", ");

    const simMetric3 = document.getElementById("sim-metric-3");
    if (simMetric3) {
        switch (currentRole) {
            case "Steward": simMetric3.textContent = "Data Steward"; break;
            case "Owner": simMetric3.textContent = "Business Owner"; break;
            case "Admin": simMetric3.textContent = "Admin BI"; break;
            default: simMetric3.textContent = "Standard User"; break;
        }
    }

    const simMetric2 = document.getElementById("sim-metric-2");
    if (simMetric2) {
        // Adjust mocked rows count based on RLS role
        if (currentRole === "Admin" || currentRole === "Owner") {
            simMetric2.textContent = "1.8M lignes";
        } else if (currentRole === "Steward") {
            simMetric2.textContent = "1.2M lignes";
        } else {
            simMetric2.textContent = "324K lignes";
        }
    }

    const simFiltersList = document.getElementById("sim-applied-filters-list");
    if (simFiltersList) {
        simFiltersList.innerHTML = "";
        if (activeFilters.length === 0) {
            simFiltersList.innerHTML = `<li><em>Aucun filtre de catalogue n'est actuellement actif.</em></li>`;
        } else {
            activeFilters.forEach(f => {
                const li = document.createElement("li");
                li.innerHTML = `Paramètre d'URL : <strong>${f}</strong>`;
                simFiltersList.appendChild(li);
            });
        }
    }

    // Reset Offline Simulator display to off by default
    const simulator = document.getElementById("fallback-report-simulator");
    const toggleSimBtn = document.getElementById("viewer-toggle-simulator-btn");
    if (simulator) simulator.style.display = "none";
    if (iframeEl) iframeEl.style.opacity = "1";
    if (toggleSimBtn) {
        toggleSimBtn.textContent = "Utiliser le simulateur offline";
        toggleSimBtn.style.backgroundColor = "";
        toggleSimBtn.style.color = "";
    }

    // Reset simulator active tab
    document.querySelectorAll('.viewer-sidebar .viewer-page-item').forEach(p => p.classList.remove('active'));
    const firstTab = document.querySelector('.viewer-sidebar [data-page="page-1"]');
    if (firstTab) firstTab.classList.add('active');

    document.querySelectorAll('.viewer-canvas .sim-page').forEach(page => page.classList.remove('active'));
    const firstPage = document.getElementById("sim-page-1");
    if (firstPage) firstPage.classList.add('active');

    closeDrawer();

    // Show report viewer pop-in drawer with sliding right transition
    const container = document.getElementById("report-viewer-container");
    const overlay = document.getElementById("drawer-overlay");
    if (container) {
        container.style.display = "flex";
        // Force reflow
        container.offsetWidth;
        container.classList.add("open");
    }
    if (overlay) overlay.classList.add("open");
    document.body.style.overflow = "hidden"; // disable body scrolling
}

function closeReportViewer() {
    const iframeEl = document.getElementById("report-iframe");
    if (iframeEl) iframeEl.src = "about:blank"; // clear iframe context

    const container = document.getElementById("report-viewer-container");
    const overlay = document.getElementById("drawer-overlay");
    const detailsDrawer = document.getElementById("report-drawer");
    
    if (container) {
        container.classList.remove("open");
        setTimeout(() => {
            if (!container.classList.contains("open")) {
                container.style.display = "none";
            }
        }, 300);
    }
    
    if (overlay && (!detailsDrawer || !detailsDrawer.classList.contains("open"))) {
        overlay.classList.remove("open");
    }
    document.body.style.overflow = ""; // restore body scrolling
    renderAll();
}

// 11. Share Modal Logic
function openShareModal(reportId) {
    const r = reports.find(item => item.id === reportId);
    if (!r) return;

    document.getElementById("modal-report-id").value = reportId;
    document.getElementById("share-user").value = "";
    document.getElementById("share-reason").value = "";
    document.getElementById("share-workflow").value = "direct";

    const modal = document.getElementById("share-modal");
    if (modal) modal.style.display = "flex";
}

function closeShareModal() {
    const modal = document.getElementById("share-modal");
    if (modal) modal.style.display = "none";
}

function submitShareWorkflow() {
    const reportId = document.getElementById("modal-report-id").value;
    const r = reports.find(item => item.id === reportId);
    if (!r) return;

    const shareUser = document.getElementById("share-user").value.trim();
    const shareReason = document.getElementById("share-reason").value.trim();
    const workflowType = document.getElementById("share-workflow").value;

    if (shareUser === "") {
        alert("Veuillez renseigner le nom ou l'e-mail du collaborateur.");
        return;
    }

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    
    // Add to pending workflows queue
    const newWf = {
        id: "wf-" + Date.now(),
        timestamp: formattedDate,
        requester: "Damien G.",
        beneficiary: shareUser,
        reportId: reportId,
        reportTitle: r.title,
        reason: shareReason,
        workflowType: workflowType
    };
    pendingWorkflows.push(newWf);
    saveWorkflowsToStorage();

    // Log the request
    const workflowLog = {
        timestamp: formattedDate,
        user: "Damien G.",
        event: "Workflow Partage",
        target: `${r.title} -> ${shareUser}`,
        status: "En attente de validation AD"
    };

    logs.unshift(workflowLog);
    saveLogsToStorage();

    closeShareModal();
    renderAll();

    alert(`Le workflow de partage pour "${r.title}" vers "${shareUser}" a été initié et ajouté aux tâches de validation.`);
}

function toggleFavorite(reportId) {
    const idx = favorites.indexOf(reportId);
    if (idx === -1) {
        favorites.push(reportId);
    } else {
        favorites.splice(idx, 1);
    }
    saveFavoritesToStorage();
    renderAll();
}

// ========================================================
// 15. ANOMALY REPORTING LOGIC (FEEDBACK LOOP)
// ========================================================
function openBugReportModal() {
    const container = document.getElementById("report-viewer-container");
    const reportId = container ? container.getAttribute("data-report-id") : null;
    if (!reportId) return;

    const r = reports.find(item => item.id === reportId);
    if (!r) return;

    document.getElementById("bug-report-id").value = reportId;
    document.getElementById("bug-description").value = "";
    document.getElementById("bug-type").value = "Données incorrectes";

    const modal = document.getElementById("bug-report-modal");
    if (modal) modal.style.display = "flex";
}

function closeBugReportModal() {
    const modal = document.getElementById("bug-report-modal");
    if (modal) modal.style.display = "none";
}

function submitBugReport() {
    const reportId = document.getElementById("bug-report-id").value;
    const type = document.getElementById("bug-type").value;
    const desc = document.getElementById("bug-description").value.trim();

    if (desc === "") {
        alert("Veuillez saisir une description de l'anomalie.");
        return;
    }

    const r = reports.find(item => item.id === reportId);
    if (!r) return;

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    
    const newLog = {
        timestamp: formattedDate,
        user: "Damien G.",
        event: "Signalement Anomalie",
        target: r.title,
        status: `Transmis (${type})`
    };
    logs.unshift(newLog);
    saveLogsToStorage();

    addSyncLog(formattedDate, "Feedback Loop", `Signalement anomalie transmis pour "${r.title}". Destinataires : Steward et Owner (${r.owner}).`, "Succès");

    alert(`Votre signalement pour le rapport "${r.title}" a été envoyé avec succès. Le Steward et le Business Owner ont été notifiés.`);
    closeBugReportModal();
    renderAll();
}

// ========================================================
// 16. ACCESS RECERTIFICATION LOGIC
// ========================================================
let recertifications = [
    { id: "recert-1", reportId: "rep-1", adGroup: "DW_POWERBI_QUALITE_ANALYSESADHOC", lastControl: "12/03/2026", status: "Conforme" },
    { id: "recert-2", reportId: "rep-4", adGroup: "DW_POWERBI_QUALITE_BO", lastControl: "18/02/2026", status: "Conforme" },
    { id: "recert-3", reportId: "rep-12", adGroup: "DW_POWERBI_IT_ADMIN", lastControl: "04/05/2026", status: "Conforme" },
    { id: "recert-4", reportId: "rep-18", adGroup: "DW_POWERBI_QUALITE_ALL_STAFF", lastControl: "10/01/2026", status: "Recertification requise" }
];

function loadRecertifications() {
    const savedRecerts = localStorage.getItem("cfl_bi_recertifications");
    if (savedRecerts) {
        recertifications = JSON.parse(savedRecerts);
    } else {
        saveRecertifications();
    }
}

function saveRecertifications() {
    localStorage.setItem("cfl_bi_recertifications", JSON.stringify(recertifications));
}

function renderRecertificationTable() {
    const tbody = document.getElementById("recertification-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    recertifications.forEach(rec => {
        const r = reports.find(item => item.id === rec.reportId);
        if (!r) return;

        const membersCount = rec.id === "recert-1" ? 5 : (rec.id === "recert-2" ? 3 : (rec.id === "recert-3" ? 2 : 6));
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${r.title}</strong></td>
            <td><code style="font-family: monospace; font-size: 11.5px; background: #e0e0e0; padding: 2px 4px; border-radius: 3px;">${rec.adGroup}</code></td>
            <td>${membersCount} utilisateurs</td>
            <td>${rec.lastControl}</td>
            <td>
                <button class="btn-sm-action primary" onclick="openRecertifyModal('${rec.id}')">Contrôler</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

let activeRecertId = null;
const simulatedAdUsers = [
    { name: "Laurent Leclerc", email: "laurent.leclerc@cfl.lu" },
    { name: "Jean-Paul Weber", email: "jean-paul.weber@cfl.lu" },
    { name: "Sophie Martin", email: "sophie.martin@cfl.lu" },
    { name: "Michel Becker", email: "michel.becker@cfl.lu" }
];

function openRecertifyModal(recertId) {
    const rec = recertifications.find(item => item.id === recertId);
    if (!rec) return;

    activeRecertId = recertId;
    const r = reports.find(item => item.id === rec.reportId);
    if (!r) return;

    document.getElementById("recert-report-title").textContent = r.title;
    document.getElementById("recert-ad-group").textContent = rec.adGroup;

    const tbody = document.getElementById("recert-users-tbody");
    if (tbody) {
        tbody.innerHTML = "";
        simulatedAdUsers.forEach((usr, idx) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${usr.name}</strong></td>
                <td><code style="font-family: monospace; font-size: 11.5px;">${usr.email}</code></td>
                <td style="text-align: center;">
                    <div style="display: inline-flex; border: 1px solid var(--cfl-gray-border); border-radius: 4px; overflow: hidden;">
                        <button class="btn-decision active" id="dec-keep-${idx}" onclick="setDecision(${idx}, 'keep')" style="background-color: #34c759; color: white; border: none; padding: 4px 10px; font-size: 11px; cursor: pointer; font-weight:600;">Conserver</button>
                        <button class="btn-decision" id="dec-revoke-${idx}" onclick="setDecision(${idx}, 'revoke')" style="background-color: #f4f4f4; color: #333; border: none; padding: 4px 10px; font-size: 11px; cursor: pointer; font-weight:600;">Révoquer</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    const modal = document.getElementById("recertify-modal");
    if (modal) modal.style.display = "flex";
}

function setDecision(idx, type) {
    const btnKeep = document.getElementById(`dec-keep-${idx}`);
    const btnRevoke = document.getElementById(`dec-revoke-${idx}`);
    if (type === "keep") {
        btnKeep.style.backgroundColor = "#34c759";
        btnKeep.style.color = "white";
        btnRevoke.style.backgroundColor = "#f4f4f4";
        btnRevoke.style.color = "#333";
    } else {
        btnKeep.style.backgroundColor = "#f4f4f4";
        btnKeep.style.color = "#333";
        btnRevoke.style.backgroundColor = "#ff3b30";
        btnRevoke.style.color = "white";
    }
}

function closeRecertifyModal() {
    const modal = document.getElementById("recertify-modal");
    if (modal) modal.style.display = "none";
}

function submitRecertification() {
    if (!activeRecertId) return;

    const rec = recertifications.find(item => item.id === activeRecertId);
    if (!rec) return;

    const r = reports.find(item => item.id === rec.reportId);
    if (!r) return;

    const now = new Date();
    const formattedDateStr = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;
    const formattedTimeStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    rec.lastControl = formattedDateStr;
    rec.status = "Conforme";
    saveRecertifications();

    const newLog = {
        timestamp: formattedTimeStr,
        user: currentRole === "Steward" ? "Steward BI" : "Business Owner",
        event: "Recertification Accès",
        target: r.title,
        status: "Révisé (AD)"
    };
    logs.unshift(newLog);
    saveLogsToStorage();

    addSyncLog(formattedTimeStr, "Active Directory", `Recertification complétée pour le groupe "${rec.adGroup}" (Rapport : ${r.title}).`, "Succès");

    alert(`La recertification du groupe d'accès AD "${rec.adGroup}" a été enregistrée avec succès.`);
    closeRecertifyModal();
    renderAll();
}

// Expose decisions helper globally
window.openRecertifyModal = openRecertifyModal;
window.setDecision = setDecision;
window.resolvePssiCompliance = resolvePssiCompliance;

// ========================================================
// 17. ADMIN BI CONSOLE LOGIC (TELEMETRY, SYNC LOGS, PSSI ALERT)
// ========================================================
let syncLogs = [
    { timestamp: "2026-07-24 14:00", flow: "Active Directory", message: "Synchro réussie. 182 comptes vérifiés.", status: "Succès" },
    { timestamp: "2026-07-24 12:00", flow: "Data Galaxy", message: "Mise à jour des tags. 34 rapports synchronisés.", status: "Succès" },
    { timestamp: "2026-07-24 10:00", flow: "Active Directory", message: "Synchro réussie. 182 comptes vérifiés.", status: "Succès" },
    { timestamp: "2026-07-24 08:00", flow: "Data Galaxy", message: "Erreur de connexion (Timeout serveur api.datagalaxy.com). Retrying in 15min.", status: "Échec" }
];

function addSyncLog(timestamp, flow, message, status) {
    syncLogs.unshift({ timestamp, flow, message, status });
    if (syncLogs.length > 30) syncLogs.pop();
    localStorage.setItem("cfl_bi_sync_logs", JSON.stringify(syncLogs));
}

function loadSyncLogs() {
    const saved = localStorage.getItem("cfl_bi_sync_logs");
    if (saved) {
        syncLogs = JSON.parse(saved);
    }
}

function renderAdminConsole() {
    const slowQueriesTbody = document.getElementById("telemetry-slow-queries-tbody");
    if (slowQueriesTbody) {
        slowQueriesTbody.innerHTML = `
            <tr>
                <td><strong>rep-12 Analyse retards</strong></td>
                <td>damien.g@cfl.lu</td>
                <td style="color: #ff9500; font-weight: bold;">4.2s</td>
            </tr>
            <tr>
                <td><strong>rep-18 Qualité données</strong></td>
                <td>jean-paul.w@cfl.lu</td>
                <td style="color: #ff3b30; font-weight: bold;">6.8s</td>
            </tr>
            <tr>
                <td><strong>rep-4 Suivi RH hebdo</strong></td>
                <td>sophie.m@cfl.lu</td>
                <td style="color: #ff9500; font-weight: bold;">3.9s</td>
            </tr>
        `;
    }

    const syncTbody = document.getElementById("sync-logs-tbody");
    if (syncTbody) {
        syncTbody.innerHTML = "";
        syncLogs.forEach(log => {
            const statusClass = log.status === "Succès" ? "color: #248a3d;" : "color: #dc3545; font-weight: bold;";
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${log.timestamp}</td>
                <td><strong>${log.flow}</strong></td>
                <td>${log.message}</td>
                <td style="${statusClass}">${log.status}</td>
            `;
            syncTbody.appendChild(tr);
        });
    }

    const complianceTbody = document.getElementById("pssi-compliance-tbody");
    const summaryCard = document.getElementById("pssi-compliance-alert-summary");
    const summaryText = document.getElementById("pssi-compliance-alert-text");

    if (complianceTbody) {
        complianceTbody.innerHTML = "";
        let violationsCount = 0;

        reports.forEach(r => {
            const isSensitive = (r.pssi === "restreint" || r.pssi === "confidentiel");
            const hasBroadGroup = r.adGroups.some(g => 
                g.includes("PUBLIC") || 
                g.includes("ALL") || 
                g.includes("STAFF") || 
                g.includes("EVERYONE")
            );

            const tr = document.createElement("tr");
            let evaluationCell = "";
            let actionCell = "";

            if (isSensitive && hasBroadGroup) {
                violationsCount++;
                evaluationCell = `<span style="color: #dc3545; font-weight: 700;">⚠️ Alerte: Groupe trop large</span>`;
                actionCell = `<button class="btn-sm-action danger" onclick="resolvePssiCompliance('${r.id}')" style="background-color: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">Restreindre l'accès</button>`;
            } else if (isSensitive) {
                evaluationCell = `<span style="color: #248a3d; font-weight: 600;">✓ Conforme (Groupe restreint)</span>`;
                actionCell = `<span style="color: var(--text-secondary); font-size: 11.5px;">Aucune action requise</span>`;
            } else {
                evaluationCell = `<span style="color: var(--text-secondary);">Non-sensible (PSSI: ${r.pssi.toUpperCase()})</span>`;
                actionCell = `<span style="color: var(--text-secondary); font-size: 11.5px;">N/A</span>`;
            }

            tr.innerHTML = `
                <td><strong>${r.title}</strong></td>
                <td><span class="pssi-badge ${r.pssi}">${r.pssi.toUpperCase()}</span></td>
                <td><code style="font-family: monospace; font-size: 11.5px; background: #e0e0e0; padding: 2px 4px; border-radius: 3px;">${r.adGroups.join(", ")}</code></td>
                <td>${evaluationCell}</td>
                <td style="text-align: center;">${actionCell}</td>
            `;
            complianceTbody.appendChild(tr);
        });

        if (summaryCard && summaryText) {
            if (violationsCount > 0) {
                summaryCard.style.display = "block";
                summaryText.innerHTML = `Scanner PSSI : <strong>${violationsCount} anomalie(s) active(s)</strong> de droits d'accès détectée(s). Les rapports sensibles disposent de groupes AD trop ouverts.`;
            } else {
                summaryCard.style.display = "none";
            }
        }
    }
}

function resolvePssiCompliance(reportId) {
    const r = reports.find(item => item.id === reportId);
    if (!r) return;

    r.adGroups = r.adGroups.map(g => {
        if (g.includes("ALL") || g.includes("STAFF") || g.includes("PUBLIC")) {
            return g.replace("_ALL_STAFF", "_RESTRICT").replace("_PUBLIC", "_RESTRICT");
        }
        return g;
    });

    saveReportsToStorage();

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const newLog = {
        timestamp: formattedDate,
        user: "Admin BI",
        event: "Correction PSSI",
        target: r.title,
        status: "Restreint (AD)"
    };
    logs.unshift(newLog);
    saveLogsToStorage();

    addSyncLog(formattedDate, "Active Directory", `Correction PSSI appliquée pour "${r.title}". Le groupe AD a été restreint.`, "Succès");

    alert(`Action corrective appliquée. Le groupe d'accès AD pour le rapport "${r.title}" a été restreint aux seuls agents autorisés.`);
    renderAll();
}

function forceManualSync() {
    const btn = document.getElementById("admin-sync-now-btn");
    const dgBadge = document.getElementById("admin-dg-sync-badge");

    if (btn) {
        const prevText = btn.textContent;
        btn.textContent = "Synchronisation...";
        btn.disabled = true;
        btn.style.opacity = "0.7";
        if (dgBadge) {
            dgBadge.textContent = "Synchro en cours...";
            dgBadge.style.backgroundColor = "rgba(255, 149, 0, 0.1)";
            dgBadge.style.color = "#c67c00";
        }

        setTimeout(() => {
            const now = new Date();
            const formattedDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

            addSyncLog(formattedDate, "Active Directory", "Synchro manuelle forcée : 182 comptes utilisateurs AD et 44 groupes vérifiés.", "Succès");
            addSyncLog(formattedDate, "Data Galaxy", "Synchro manuelle forcée : 44 fiches d'identité et 25 tags mis à jour.", "Succès");

            btn.textContent = prevText;
            btn.disabled = false;
            btn.style.opacity = "";
            if (dgBadge) {
                dgBadge.textContent = "Opérationnel";
                dgBadge.style.backgroundColor = "";
                dgBadge.style.color = "";
            }

            alert("La synchronisation manuelle des habilitations Active Directory et du dictionnaire Data Galaxy s'est déroulée avec succès.");
            renderAll();
        }, 1200);
    }
}
