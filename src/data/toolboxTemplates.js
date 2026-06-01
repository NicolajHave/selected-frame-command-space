// Toolbox templates for the Command Space.
//
// V1: edit this file directly. Each template carries one or more language
// variants, each with a subject and body. Placeholders use [SQUARE BRACKETS]
// so they are easy to spot and replace in Outlook after copying.
//
// To add a template: append an object to TEMPLATES with a unique id and at
// least an `en` language variant. Add new categories in CATEGORIES.

/**
 * @typedef {Object} LangVariant
 * @property {string} subject
 * @property {string} body
 *
 * @typedef {Object} Attachment
 * @property {string} filename     Filename used in the download dialog.
 * @property {string} url          Public path, e.g. "/toolbox/foo.pdf".
 * @property {string} label        Short human label, e.g. "Partner Briefing Filecard".
 *
 * @typedef {Object} Template
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} category                       One of CATEGORIES[].id
 * @property {Object.<string, LangVariant>} languages  Keyed by language code.
 * @property {Attachment[]} [attachments]             Files surfaced under the template.
 */

/** Category tabs. `count` is derived at render time. */
export const CATEGORIES = [
  { id: "partner-emails", label: "Partner Emails" },
  { id: "briefing-support", label: "Briefing Support" },
  { id: "project-handover", label: "Project Handover" },
  { id: "follow-up", label: "Follow-up" },
  { id: "internal-notes", label: "Internal Notes" },
];

/** Supported languages. `short` is the 2-letter pill label. */
export const LANGUAGES = [
  { code: "en", label: "English",   short: "EN" },
  { code: "da", label: "Dansk",     short: "DA" },
  { code: "de", label: "Deutsch",   short: "DE" },
  { code: "fr", label: "Français",  short: "FR" },
  { code: "es", label: "Español",   short: "ES" },
  { code: "it", label: "Italiano",  short: "IT" },
];

/** @type {Template[]} */
export const TEMPLATES = [
  {
    id: "project-briefing-request",
    title: "Project Briefing Request",
    description:
      "Email template for collecting the necessary project information before a Selected Frame filecard can be completed.",
    category: "partner-emails",
    attachments: [
      {
        filename: "Selected_Frame_Partner_Briefing_Filecard.pdf",
        url: "/toolbox/Selected_Frame_Partner_Briefing_Filecard.pdf",
        label: "Partner Briefing Filecard",
      },
    ],
    languages: {
      en: {
        subject: "Selected Frame — Project Briefing: [PROJECT NAME]",
        body: `Hi [Contact Name],

I hope you're doing well.

We're excited to move forward with a new Selected Frame setup at [Store Name], and to get started we need a few key details from your end.

Please find the attached briefing form. It covers:

• Location & space details
• Your main contact information
• Area dimensions & setup conditions
• Logistics & delivery access
• Installation practicalities

Could you fill it in and return it — along with a floorplan in DWG format and photos of the dedicated shop floor — by [DATE]?

Please note that the floorplan is required before we can initiate the project, so the sooner we have it, the better.

If anything is unclear or you'd like to go through it together on a call, just let me know — happy to help.

Looking forward to working on this with you.

Best regards,`,
      },
      da: {
        subject: "Selected Frame — Projektbriefing: [PROJEKTNAVN]",
        body: `Hej [Kontaktnavn],

Vi glæder os til at komme i gang med et nyt Selected Frame-setup i [Butiksnavn], og for at vi kan gå videre har vi brug for nogle oplysninger fra jer.

Vedhæftet finder du vores briefingformular. Den dækker:

• Placering og rumforhold
• Kontaktoplysninger
• Arealets dimensioner og opsætningsforhold
• Logistik og leveringsadgang
• Praktiske installationsforhold

Kan du udfylde den og returnere den — vedlagt en plantegning i DWG-format samt billeder af det dedikerede shopareal — senest [DATO]?

Bemærk venligst, at plantegningen er påkrævet, før vi kan igangsætte projektet, så jo hurtigere vi modtager den, jo bedre.

Hvis noget er uklart, eller du hellere vil gennemgå det over et opkald, er du meget velkommen til at skrive — jeg hjælper gerne.

Ser frem til samarbejdet.

Med venlig hilsen,`,
      },
      de: {
        subject: "Selected Frame — Projekt-Briefing: [PROJEKTNAME]",
        body: `Hallo [Name des Ansprechpartners],

ich hoffe, es geht Ihnen gut.

Wir freuen uns, mit dem neuen Selected Frame-Setup in [Filialname] voranzukommen. Damit wir starten können, benötigen wir noch einige zentrale Informationen von Ihrer Seite.

Im Anhang finden Sie das Briefing-Formular. Es umfasst:

• Standort- und Raumangaben
• Ihre wichtigsten Ansprechpartner
• Flächenmaße und Einbaubedingungen
• Logistik und Lieferzugang
• Praktische Installationsdetails

Könnten Sie es ausfüllen und uns zurücksenden — gemeinsam mit einem Grundriss im DWG-Format und Fotos der vorgesehenen Verkaufsfläche — bis spätestens [DATUM]?

Bitte beachten Sie, dass der Grundriss Voraussetzung für den Projektstart ist. Je früher uns dieser vorliegt, desto besser.

Sollten Fragen offen sein oder möchten Sie es gerne in einem kurzen Call gemeinsam durchgehen, melden Sie sich jederzeit — ich helfe gerne weiter.

Ich freue mich auf die Zusammenarbeit.

Mit freundlichen Grüßen,`,
      },
      fr: {
        subject: "Selected Frame — Brief projet : [NOM DU PROJET]",
        body: `Bonjour [Nom du contact],

J'espère que vous allez bien.

Nous sommes ravis d'avancer sur la nouvelle installation Selected Frame chez [Nom du magasin]. Pour démarrer, nous avons besoin de quelques informations clés de votre côté.

Vous trouverez ci-joint le formulaire de brief. Il couvre :

• Localisation et caractéristiques du lieu
• Vos principaux contacts
• Dimensions de la surface et conditions d'installation
• Logistique et accès livraison
• Aspects pratiques de l'installation

Pourriez-vous le compléter et nous le renvoyer — accompagné d'un plan au format DWG et de photos de la surface dédiée — pour le [DATE] au plus tard ?

À noter que le plan est indispensable avant le lancement du projet : plus nous le recevons tôt, mieux c'est.

Si quoi que ce soit n'est pas clair, ou si vous préférez en discuter ensemble par téléphone, n'hésitez pas — je suis à votre disposition.

Au plaisir de travailler avec vous sur ce projet.

Cordialement,`,
      },
      es: {
        subject: "Selected Frame — Brief de proyecto: [NOMBRE DEL PROYECTO]",
        body: `Hola [Nombre del contacto],

Espero que estés bien.

Nos hace ilusión avanzar con la nueva instalación Selected Frame en [Nombre de la tienda]. Para poder empezar, necesitamos algunos datos clave por vuestra parte.

Adjunto encontrarás el formulario de brief. Cubre:

• Ubicación y características del espacio
• Vuestro contacto principal
• Dimensiones del área y condiciones de montaje
• Logística y acceso para la entrega
• Aspectos prácticos de la instalación

¿Podrías rellenarlo y devolvérnoslo — junto con un plano en formato DWG y fotos del área destinada a la tienda — antes del [FECHA]?

Ten en cuenta que el plano es imprescindible antes de poder iniciar el proyecto, así que cuanto antes lo tengamos, mejor.

Si algo no queda claro o prefieres que lo revisemos juntos en una llamada, dímelo sin problema — encantado de ayudar.

Quedo a la espera y con ganas de empezar.

Un saludo,`,
      },
      it: {
        subject: "Selected Frame — Brief di progetto: [NOME DEL PROGETTO]",
        body: `Ciao [Nome del contatto],

spero tu stia bene.

Siamo entusiasti di procedere con il nuovo setup Selected Frame presso [Nome del negozio]. Per iniziare, ci servono alcune informazioni chiave da parte vostra.

In allegato trovi il modulo di brief. Comprende:

• Localizzazione e dettagli dello spazio
• Riferimenti del contatto principale
• Dimensioni dell'area e condizioni di installazione
• Logistica e accesso per la consegna
• Aspetti pratici dell'installazione

Potresti compilarlo e rimandarcelo — insieme a una planimetria in formato DWG e a foto dell'area dedicata — entro il [DATA]?

Ti segnalo che la planimetria è indispensabile prima di poter avviare il progetto: prima la riceviamo, meglio è.

Se qualcosa non è chiaro o preferisci che lo guardiamo insieme in una call, fammi sapere — sono qui per aiutarti.

Non vediamo l'ora di iniziare.

Cordiali saluti,`,
      },
    },
  },
  {
    id: "one-month-prior-installation-alignment",
    title: "One-Month Prior Installation Alignment",
    description:
      "Email template for final practical alignment with the partner approximately one month before Selected Frame delivery and installation.",
    category: "partner-emails",
    languages: {
      en: {
        subject: "Selected Frame — Final Installation Alignment: [Store / City]",
        body: `Dear [Partner Name],

We are now approaching the delivery and installation of the SELECTED Frame setup in [Store / City].

As we are now approximately one month prior to installation, we would like to make a final alignment to ensure that everything is ready on site and that we have all practical details confirmed.

Please find attached the final floorplan for reference.

1. Key Project Dates

Mounting / installation date: [Date]
Estimated delivery time: [Time]
Estimated installation duration: [Duration / see attached installation plan]
Merchandising date: [Date]
Opening date: [Date]

Please confirm that the above dates are aligned with your internal planning.

2. Delivery & Installation Details

The installation will include:

• Delivery of SELECTED Frame furniture and fixtures
• Assembly and installation of the shopfit elements
• Installation of rails, racks and related fixtures
• Final merchandising and styling according to SELECTED guidelines

Number of installers on site: [Number of people]
Additional SELECTED / partner team members on site: [Names / roles if relevant]

Please ensure that access is granted upon arrival and that the installation area is available from the agreed time.

3. Site Readiness Requirements

To ensure a smooth installation, we kindly ask you to confirm that the following will be completed prior to our arrival:

• The space is fully cleared of existing fixtures, stock and materials
• Walls are finished and painted according to the agreed colour specification
• Flooring is completed and protected if required
• Electrical work is completed according to the approved plan
• Power outlets are installed, tested and ready for use
• Internet access is available for digital screens, if applicable
• Any required permissions, access approvals or mall/store regulations have been handled internally

If any of the above is not finalised, or if there is anything we need to be aware of, please inform us as soon as possible.

4. Access & Logistics

Please confirm the following practical details:

• Delivery address: [Address]
• Preferred unloading point: [Loading zone / shop entrance / goods reception]
• Earliest possible unloading time: [Time]
• Any specific access requirements or time restrictions
• Whether a pallet lifter or unloading equipment is available on site
• Elevator access and maximum load capacity, if applicable
• Parking arrangements for the installation team
• Security clearance or check-in procedure, if required

5. Digital Screens

If digital screens are included in the setup, please confirm:

• Power supply is available at the agreed screen position
• WiFi or LAN access is available
• Network access can be provided during installation
• Any local IT restrictions or approval processes are clarified in advance

Our screen content is managed centrally by SELECTED HQ. Once connected, no daily manual operation should be required.

6. Conditions & On-site Responsibilities

To avoid any misunderstandings, please note the following conditions:

• The installation area must be ready and accessible at the agreed time
• Any delays caused by unfinished site preparation may affect the installation timeline
• Any additional on-site work not included in the agreed scope must be aligned separately
• Local requirements, restrictions or changes must be communicated before installation

Please also confirm whether:

• Professional cleaning is scheduled after installation
• Waste disposal is handled locally, or whether our team should remove packaging
• There are any local rules regarding noise, working hours or after-hours installation

7. Sign-off

Please confirm who will be responsible for signing off the completed installation on site:

Name: [Name]
Role: [Role]
Phone: [Phone]
Email: [Email]

8. Guidelines & Training Material

For reference, please find the relevant links below:

VM Guiding Principles: [Insert link]
Sales Training Material: [Insert link]

These materials should be shared with the relevant local store team before opening to ensure a strong and consistent launch.

If there are any deviations, uncertainties or open questions, it is important that we address them in advance.

Please confirm the above details at your earliest convenience, so we can move forward with a fully aligned installation plan.

We look forward to a successful installation and opening.

Best regards,
Nicolaj`,
      },
      da: {
        subject: "Selected Frame — Endelig installationsafstemning: [Butik / By]",
        body: `Kære [Partnernavn],

Vi nærmer os nu levering og installation af SELECTED Frame-setuppet i [Butik / By].

Da vi er cirka en måned før installation, vil vi gerne lave en endelig afstemning for at sikre, at alt er klart på stedet, og at vi har styr på alle praktiske detaljer.

Vedhæftet finder du den endelige plantegning til reference.

1. Vigtige projektdatoer

Monterings-/installationsdato: [Dato]
Forventet leveringstidspunkt: [Tidspunkt]
Forventet installationsvarighed: [Varighed / se vedhæftede installationsplan]
Merchandising-dato: [Dato]
Åbningsdato: [Dato]

Bekræft venligst, at ovenstående datoer passer med jeres interne planlægning.

2. Levering & installation

Installationen omfatter:

• Levering af SELECTED Frame-møbler og inventar
• Samling og montering af shopfit-elementer
• Montering af stænger, racks og tilhørende inventar
• Endelig merchandising og styling efter SELECTED's retningslinjer

Antal montører på stedet: [Antal personer]
Yderligere SELECTED-/partnerteam på stedet: [Navne/roller hvis relevant]

Sørg venligst for, at der er adgang ved ankomst, og at installationsområdet er tilgængeligt fra det aftalte tidspunkt.

3. Krav til klargøring på stedet

For at sikre en glidende installation beder vi om bekræftelse på, at følgende er på plads inden vores ankomst:

• Området er fuldt ryddet for eksisterende inventar, varer og materialer
• Vægge er færdige og malet i den aftalte farve
• Gulv er færdigt og om nødvendigt afdækket
• El-arbejde er udført efter den godkendte plan
• Stikkontakter er installeret, testet og klar til brug
• Internetadgang er tilgængelig til digitale skærme, hvor relevant
• Eventuelle tilladelser, adgangsgodkendelser eller center-/butiksregler er håndteret internt

Hvis noget af ovenstående ikke er på plads, eller hvis der er noget, vi skal være opmærksomme på, så giv os besked hurtigst muligt.

4. Adgang & logistik

Bekræft venligst følgende praktiske forhold:

• Leveringsadresse: [Adresse]
• Foretrukket aflæsningssted: [Vareindlevering / butiksindgang / lasterampe]
• Tidligst mulige aflæsningstidspunkt: [Tidspunkt]
• Eventuelle specifikke adgangskrav eller tidsbegrænsninger
• Om der findes palleløfter eller andet aflæsningsudstyr på stedet
• Elevatoradgang og maksimal lastkapacitet, hvor relevant
• Parkeringsmuligheder for installationsteamet
• Eventuel sikkerhedsklarering eller indtjekningsprocedure

5. Digitale skærme

Hvis digitale skærme indgår i setuppet, bekræft venligst:

• Strøm er tilgængelig ved den aftalte skærmposition
• WiFi- eller LAN-adgang er tilgængelig
• Netværksadgang kan stilles til rådighed under installation
• Eventuelle lokale IT-restriktioner eller godkendelsesprocesser er afklaret på forhånd

Vores skærmindhold styres centralt af SELECTED HQ. Når skærmen er tilsluttet, kræves der ikke daglig manuel betjening.

6. Vilkår & ansvar på stedet

For at undgå misforståelser bedes I bemærke følgende:

• Installationsområdet skal være klar og tilgængeligt på det aftalte tidspunkt
• Forsinkelser pga. ufærdig klargøring kan påvirke installationsforløbet
• Ekstra arbejde på stedet, der ikke er inkluderet i scope, skal aftales særskilt
• Lokale krav, restriktioner eller ændringer skal kommunikeres inden installation

Bekræft venligst også:

• Om der er bestilt professionel rengøring efter installation
• Om bortskaffelse af affald håndteres lokalt, eller vores team skal fjerne emballage
• Om der er lokale regler om støj, arbejdstider eller installation uden for åbningstid

7. Aflevering

Bekræft venligst, hvem der har ansvaret for at godkende den færdige installation på stedet:

Navn: [Navn]
Rolle: [Rolle]
Telefon: [Telefon]
E-mail: [E-mail]

8. Guidelines & træningsmateriale

Til reference finder I de relevante links nedenfor:

VM Guiding Principles: [Indsæt link]
Sales Training Material: [Indsæt link]

Materialerne bør deles med det lokale butiksteam inden åbning for at sikre en stærk og konsistent lancering.

Hvis der er afvigelser, usikkerheder eller åbne spørgsmål, er det vigtigt, at vi får dem afklaret i god tid.

Bekræft venligst ovenstående hurtigst muligt, så vi kan gå videre med en fuldt afstemt installationsplan.

Vi ser frem til en vellykket installation og åbning.

Med venlig hilsen,
Nicolaj`,
      },
      de: {
        subject: "Selected Frame — Finale Installationsabstimmung: [Filiale / Stadt]",
        body: `Sehr geehrte/r [Partnername],

wir nähern uns nun der Lieferung und Installation des SELECTED Frame-Setups in [Filiale / Stadt].

Da wir uns ungefähr einen Monat vor der Installation befinden, möchten wir eine letzte Abstimmung vornehmen, um sicherzustellen, dass vor Ort alles bereit ist und alle praktischen Details bestätigt sind.

Im Anhang finden Sie den finalen Grundriss zur Referenz.

1. Wichtige Projektdaten

Montage- / Installationsdatum: [Datum]
Geschätzte Lieferzeit: [Uhrzeit]
Voraussichtliche Installationsdauer: [Dauer / siehe beigefügten Installationsplan]
Merchandising-Datum: [Datum]
Eröffnungsdatum: [Datum]

Bitte bestätigen Sie, dass die oben genannten Termine mit Ihrer internen Planung übereinstimmen.

2. Lieferung & Installation

Die Installation umfasst:

• Lieferung der SELECTED Frame-Möbel und -Einrichtung
• Montage und Aufbau der Shopfit-Elemente
• Installation von Stangen, Racks und zugehörigem Inventar
• Finale Merchandising-Umsetzung gemäß den SELECTED-Richtlinien

Anzahl der Monteure vor Ort: [Anzahl Personen]
Weitere SELECTED-/Partner-Teammitglieder vor Ort: [Namen / Rollen, falls relevant]

Bitte stellen Sie sicher, dass bei Ankunft Zugang gewährt wird und der Installationsbereich ab der vereinbarten Zeit verfügbar ist.

3. Anforderungen an die Bauseitenfertigkeit

Für einen reibungslosen Ablauf bitten wir Sie, vor unserer Ankunft Folgendes zu bestätigen:

• Die Fläche ist vollständig von bestehenden Möbeln, Ware und Material geräumt
• Wände sind fertiggestellt und in der vereinbarten Farbe gestrichen
• Boden ist fertiggestellt und ggf. abgedeckt/geschützt
• Elektroarbeiten sind nach dem freigegebenen Plan ausgeführt
• Steckdosen sind installiert, geprüft und einsatzbereit
• Internetzugang steht für digitale Bildschirme bereit (sofern relevant)
• Erforderliche Genehmigungen, Zugangsfreigaben oder Center-/Filialregeln sind intern geklärt

Sollte einer dieser Punkte nicht abgeschlossen sein oder gibt es etwas, was wir wissen sollten, informieren Sie uns bitte schnellstmöglich.

4. Zugang & Logistik

Bitte bestätigen Sie die folgenden praktischen Details:

• Lieferadresse: [Adresse]
• Bevorzugter Entladepunkt: [Ladezone / Filialeingang / Wareneingang]
• Frühest möglicher Entladezeitpunkt: [Uhrzeit]
• Besondere Zugangsanforderungen oder Zeitfenster
• Verfügbarkeit eines Hubwagens oder anderen Entladegeräts vor Ort
• Aufzugszugang und maximale Tragfähigkeit (falls relevant)
• Parkmöglichkeiten für das Installationsteam
• Sicherheitsfreigabe oder Anmeldeprozedur (falls erforderlich)

5. Digitale Bildschirme

Falls digitale Bildschirme Teil des Setups sind, bitte bestätigen:

• Stromversorgung an der vereinbarten Bildschirmposition ist gewährleistet
• WLAN- oder LAN-Zugang ist verfügbar
• Netzwerkzugang kann während der Installation bereitgestellt werden
• Lokale IT-Beschränkungen oder Freigabeprozesse sind im Vorfeld geklärt

Unsere Bildschirminhalte werden zentral von SELECTED HQ gesteuert. Nach der Einrichtung ist im Tagesbetrieb keine manuelle Bedienung erforderlich.

6. Rahmenbedingungen & Verantwortung vor Ort

Zur Vermeidung von Missverständnissen beachten Sie bitte:

• Der Installationsbereich muss zur vereinbarten Zeit bereit und zugänglich sein
• Verzögerungen durch unvollständige Bauseitenfertigkeit können den Zeitplan beeinflussen
• Zusätzliche, nicht im Scope enthaltene Arbeiten vor Ort sind separat abzustimmen
• Lokale Auflagen, Einschränkungen oder Änderungen müssen vor der Installation kommuniziert werden

Bitte bestätigen Sie außerdem:

• Ob eine professionelle Reinigung nach der Installation eingeplant ist
• Ob die Entsorgung lokal erfolgt oder unser Team die Verpackung mitnimmt
• Ob lokale Regelungen zu Lärm, Arbeitszeiten oder Installation außerhalb der Öffnungszeiten bestehen

7. Abnahme

Bitte teilen Sie uns mit, wer für die Abnahme der fertigen Installation vor Ort verantwortlich ist:

Name: [Name]
Rolle: [Rolle]
Telefon: [Telefon]
E-Mail: [E-Mail]

8. Guidelines & Schulungsmaterial

Zur Referenz finden Sie die relevanten Links nachstehend:

VM Guiding Principles: [Link einfügen]
Sales Training Material: [Link einfügen]

Die Materialien sollten vor Eröffnung mit dem lokalen Filialteam geteilt werden, um einen starken und konsistenten Launch sicherzustellen.

Sollten Abweichungen, Unsicherheiten oder offene Fragen bestehen, ist es wichtig, dass wir diese rechtzeitig adressieren.

Bitte bestätigen Sie die oben genannten Punkte zeitnah, damit wir mit einem vollständig abgestimmten Installationsplan weitergehen können.

Wir freuen uns auf eine erfolgreiche Installation und Eröffnung.

Mit freundlichen Grüßen,
Nicolaj`,
      },
      fr: {
        subject: "Selected Frame — Alignement final installation : [Magasin / Ville]",
        body: `Bonjour [Nom du partenaire],

Nous approchons de la livraison et de l'installation du setup SELECTED Frame chez [Magasin / Ville].

À environ un mois de l'installation, nous souhaitons faire un dernier point pour nous assurer que tout est prêt sur site et que tous les aspects pratiques sont confirmés.

Vous trouverez ci-joint le plan final pour référence.

1. Dates clés du projet

Date de montage / installation : [Date]
Heure de livraison estimée : [Heure]
Durée d'installation estimée : [Durée / voir plan d'installation joint]
Date de merchandising : [Date]
Date d'ouverture : [Date]

Merci de confirmer que ces dates sont en phase avec votre planning interne.

2. Détails de livraison & d'installation

L'installation comprendra :

• Livraison du mobilier et des fixtures SELECTED Frame
• Montage et installation des éléments shopfit
• Pose des barres, racks et fixtures associées
• Merchandising final et mise en scène selon les guidelines SELECTED

Nombre d'installateurs sur site : [Nombre de personnes]
Membres SELECTED / partenaires supplémentaires sur site : [Noms / rôles si pertinent]

Merci de garantir l'accès à l'arrivée et la disponibilité de la zone d'installation à partir de l'heure convenue.

3. Conditions de préparation du site

Pour assurer une installation fluide, merci de confirmer que les points suivants seront finalisés avant notre arrivée :

• L'espace est totalement libéré du mobilier, du stock et des matériaux existants
• Les murs sont finis et peints selon la spécification de couleur convenue
• Le sol est posé et protégé si nécessaire
• Les travaux électriques sont réalisés conformément au plan approuvé
• Les prises sont installées, testées et prêtes à l'emploi
• Un accès Internet est disponible pour les écrans numériques, le cas échéant
• Les autorisations, accès ou règles spécifiques au centre/magasin ont été traités en interne

Si l'un de ces éléments n'est pas finalisé, ou s'il y a un point à signaler, merci de nous prévenir au plus tôt.

4. Accès & logistique

Merci de confirmer les détails suivants :

• Adresse de livraison : [Adresse]
• Point de déchargement préféré : [Zone de chargement / entrée magasin / réception marchandises]
• Heure de déchargement la plus tôt possible : [Heure]
• Exigences d'accès ou restrictions horaires spécifiques
• Présence d'un transpalette ou de matériel de déchargement sur site
• Accès ascenseur et capacité de charge maximale, le cas échéant
• Stationnement pour l'équipe d'installation
• Procédure de contrôle de sécurité ou d'enregistrement, le cas échéant

5. Écrans numériques

Si des écrans numériques sont inclus, merci de confirmer :

• L'alimentation est disponible à l'emplacement prévu
• Un accès WiFi ou LAN est disponible
• Un accès réseau peut être fourni pendant l'installation
• Les restrictions IT locales ou processus de validation sont clarifiés à l'avance

Notre contenu écran est géré centralement par SELECTED HQ. Une fois connecté, aucune opération manuelle quotidienne ne devrait être requise.

6. Conditions & responsabilités sur site

Pour éviter tout malentendu, merci de noter :

• La zone d'installation doit être prête et accessible à l'heure convenue
• Tout retard lié à une préparation incomplète peut affecter le calendrier d'installation
• Tout travail supplémentaire non inclus dans le scope doit être aligné séparément
• Les exigences, restrictions ou changements locaux doivent être communiqués avant l'installation

Merci également de confirmer :

• Si un nettoyage professionnel est prévu après l'installation
• Si l'évacuation des déchets est gérée localement ou si notre équipe doit retirer les emballages
• L'existence de règles locales sur le bruit, les horaires de travail ou les installations hors heures d'ouverture

7. Validation finale

Merci d'indiquer qui sera responsable de la validation de l'installation sur site :

Nom : [Nom]
Rôle : [Rôle]
Téléphone : [Téléphone]
Email : [Email]

8. Guidelines & supports de formation

Pour référence, vous trouverez les liens pertinents ci-dessous :

VM Guiding Principles : [Insérer lien]
Sales Training Material : [Insérer lien]

Ces supports doivent être partagés avec l'équipe locale du magasin avant l'ouverture, pour garantir un lancement fort et cohérent.

En cas d'écarts, d'incertitudes ou de questions ouvertes, il est important que nous les adressions en amont.

Merci de confirmer les points ci-dessus dès que possible, afin que nous puissions avancer avec un plan d'installation totalement aligné.

Au plaisir d'une installation et d'une ouverture réussies.

Cordialement,
Nicolaj`,
      },
      es: {
        subject: "Selected Frame — Alineación final de instalación: [Tienda / Ciudad]",
        body: `Estimado/a [Nombre del partner],

Nos acercamos a la entrega e instalación del setup SELECTED Frame en [Tienda / Ciudad].

A aproximadamente un mes de la instalación, nos gustaría hacer una última alineación para asegurarnos de que todo está listo en sitio y que tenemos confirmados todos los detalles prácticos.

Adjunto encontrarás el plano final como referencia.

1. Fechas clave del proyecto

Fecha de montaje / instalación: [Fecha]
Hora estimada de entrega: [Hora]
Duración estimada de la instalación: [Duración / ver plan de instalación adjunto]
Fecha de merchandising: [Fecha]
Fecha de apertura: [Fecha]

Por favor, confirma que las fechas anteriores están alineadas con vuestra planificación interna.

2. Detalles de entrega e instalación

La instalación incluirá:

• Entrega del mobiliario y fixtures SELECTED Frame
• Montaje e instalación de los elementos shopfit
• Instalación de barras, racks y fixtures relacionadas
• Merchandising y styling final según las guidelines SELECTED

Número de instaladores en sitio: [Número de personas]
Miembros adicionales SELECTED / partner en sitio: [Nombres / roles si aplica]

Por favor, asegura el acceso a la llegada y que el área de instalación esté disponible desde la hora acordada.

3. Requisitos de preparación del sitio

Para una instalación fluida, te pedimos confirmar que lo siguiente estará finalizado antes de nuestra llegada:

• El espacio está totalmente despejado de mobiliario, stock y materiales existentes
• Las paredes están acabadas y pintadas según la especificación de color acordada
• El suelo está terminado y protegido si fuera necesario
• El trabajo eléctrico está realizado según el plan aprobado
• Las tomas de corriente están instaladas, probadas y listas para usar
• Hay acceso a Internet disponible para pantallas digitales, si aplica
• Permisos, accesos o normativa de centro/tienda gestionados internamente

Si alguno de los puntos no está finalizado, o hay algo a tener en cuenta, por favor avísanos cuanto antes.

4. Accesos y logística

Por favor, confirma los siguientes detalles prácticos:

• Dirección de entrega: [Dirección]
• Punto de descarga preferido: [Zona de carga / entrada de tienda / muelle de recepción]
• Hora más temprana posible para la descarga: [Hora]
• Requisitos de acceso o restricciones horarias específicas
• Si hay transpaleta u otro equipo de descarga disponible en sitio
• Acceso a ascensor y capacidad de carga máxima, si aplica
• Aparcamiento para el equipo de instalación
• Procedimiento de control de seguridad o check-in, si se requiere

5. Pantallas digitales

Si hay pantallas digitales incluidas, confirma por favor:

• Suministro eléctrico disponible en la posición acordada
• Acceso WiFi o LAN disponible
• Acceso de red durante la instalación
• Restricciones IT locales o procesos de aprobación clarificados con antelación

El contenido de pantalla se gestiona de forma centralizada por SELECTED HQ. Una vez conectada, no debería requerir operación manual diaria.

6. Condiciones y responsabilidades en sitio

Para evitar malentendidos, por favor ten en cuenta:

• El área de instalación debe estar lista y accesible a la hora acordada
• Cualquier retraso por preparación incompleta puede afectar al calendario de instalación
• Cualquier trabajo adicional fuera del scope acordado debe alinearse por separado
• Requisitos, restricciones o cambios locales deben comunicarse antes de la instalación

Por favor, confirma también:

• Si hay limpieza profesional programada tras la instalación
• Si la retirada de residuos se gestiona localmente o nuestro equipo debe llevarse los embalajes
• Si existen normas locales sobre ruido, horarios o instalación fuera de horario de apertura

7. Sign-off

Por favor, indica quién será responsable de firmar la conformidad de la instalación en sitio:

Nombre: [Nombre]
Rol: [Rol]
Teléfono: [Teléfono]
Email: [Email]

8. Guidelines y material de formación

Para referencia, encontrarás los enlaces relevantes a continuación:

VM Guiding Principles: [Insertar enlace]
Sales Training Material: [Insertar enlace]

Estos materiales deben compartirse con el equipo local de la tienda antes de la apertura, para asegurar un lanzamiento fuerte y consistente.

Si hay desviaciones, dudas o preguntas pendientes, es importante que las abordemos con antelación.

Por favor, confirma los puntos anteriores lo antes posible, para que podamos avanzar con un plan de instalación totalmente alineado.

Quedamos a la espera de una instalación y apertura exitosas.

Un saludo,
Nicolaj`,
      },
      it: {
        subject: "Selected Frame — Allineamento finale installazione: [Negozio / Città]",
        body: `Gentile [Nome del partner],

Ci stiamo avvicinando alla consegna e all'installazione del setup SELECTED Frame presso [Negozio / Città].

Essendo a circa un mese dall'installazione, vorremmo fare un allineamento finale per assicurarci che tutto sia pronto in loco e che tutti i dettagli pratici siano confermati.

In allegato trovi la planimetria finale come riferimento.

1. Date chiave del progetto

Data di montaggio / installazione: [Data]
Orario stimato di consegna: [Orario]
Durata stimata dell'installazione: [Durata / vedi piano di installazione allegato]
Data di merchandising: [Data]
Data di apertura: [Data]

Conferma per favore che le date sopra siano allineate con la vostra pianificazione interna.

2. Dettagli di consegna e installazione

L'installazione comprenderà:

• Consegna degli arredi e delle fixture SELECTED Frame
• Montaggio e installazione degli elementi shopfit
• Installazione di barre, racks e fixture correlate
• Merchandising e styling finale secondo le guidelines SELECTED

Numero di installatori in loco: [Numero di persone]
Ulteriori membri SELECTED / partner in loco: [Nomi / ruoli se rilevanti]

Assicurati che l'accesso sia garantito all'arrivo e che l'area di installazione sia disponibile dall'orario concordato.

3. Requisiti di preparazione del sito

Per garantire un'installazione fluida, ti chiediamo di confermare che i seguenti punti saranno completati prima del nostro arrivo:

• Lo spazio è completamente libero da arredi, merce e materiali esistenti
• Le pareti sono finite e tinteggiate secondo la specifica colore concordata
• Il pavimento è completato e, se necessario, protetto
• I lavori elettrici sono realizzati secondo il piano approvato
• Le prese sono installate, testate e pronte all'uso
• L'accesso a Internet è disponibile per gli schermi digitali, ove applicabile
• Eventuali autorizzazioni, approvazioni di accesso o regolamenti del centro/negozio sono gestiti internamente

Se qualcuno dei punti sopra non è completato o c'è qualcosa di cui dobbiamo essere informati, ti preghiamo di avvisarci il prima possibile.

4. Accesso e logistica

Conferma per favore i seguenti dettagli pratici:

• Indirizzo di consegna: [Indirizzo]
• Punto di scarico preferito: [Zona di carico / ingresso negozio / area ricezione merci]
• Orario di scarico più anticipato possibile: [Orario]
• Requisiti specifici di accesso o restrizioni orarie
• Disponibilità di transpallet o altre attrezzature di scarico in loco
• Accesso ascensore e portata massima, se rilevante
• Parcheggio per il team di installazione
• Procedura di controllo di sicurezza o check-in, se richiesta

5. Schermi digitali

Se sono inclusi schermi digitali nel setup, conferma per favore:

• Alimentazione disponibile nella posizione concordata
• Accesso WiFi o LAN disponibile
• Accesso di rete fornibile durante l'installazione
• Restrizioni IT locali o processi di approvazione chiariti in anticipo

I nostri contenuti per gli schermi sono gestiti centralmente da SELECTED HQ. Una volta connesso, non è richiesta operatività manuale quotidiana.

6. Condizioni e responsabilità in loco

Per evitare malintesi, ti chiediamo di tenere presente:

• L'area di installazione deve essere pronta e accessibile all'orario concordato
• Eventuali ritardi dovuti a preparazione incompleta possono incidere sui tempi di installazione
• Qualsiasi lavoro aggiuntivo non incluso nello scope deve essere allineato separatamente
• Requisiti, restrizioni o modifiche locali devono essere comunicati prima dell'installazione

Conferma anche per favore:

• Se è prevista una pulizia professionale dopo l'installazione
• Se lo smaltimento rifiuti è gestito localmente o se il nostro team deve rimuovere gli imballaggi
• Se esistono regole locali su rumore, orari di lavoro o installazione fuori orario

7. Sign-off

Indica per favore chi sarà responsabile dell'approvazione dell'installazione completata in loco:

Nome: [Nome]
Ruolo: [Ruolo]
Telefono: [Telefono]
Email: [Email]

8. Guidelines e materiale formativo

Per riferimento, trovi i link rilevanti qui sotto:

VM Guiding Principles: [Inserire link]
Sales Training Material: [Inserire link]

Questi materiali dovrebbero essere condivisi con il team locale del negozio prima dell'apertura, per garantire un lancio forte e coerente.

In caso di scostamenti, incertezze o domande aperte, è importante affrontarli con anticipo.

Conferma per favore i punti sopra il prima possibile, così da poter procedere con un piano di installazione pienamente allineato.

Restiamo in attesa di un'installazione e di un'apertura di successo.

Cordiali saluti,
Nicolaj`,
      },
    },
  },
];
