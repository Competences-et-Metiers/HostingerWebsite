
# WebApp BDC

Cette application a pour objectif d’assurer le bon déroulement des **bilans de compétences**.  
Les bénéficiaires et les consultants disposeront de **vues distinctes**, adaptées à leurs rôles respectifs.


## Fonctionnalités

Cette WebApp devra proposer un ensemble de fonctionnalités réparties sur plusieurs pages, accessibles depuis la barre de navigation de l’utilisateur.

Le bénéficiaire aura les pages suivantes :

- Tableau de bord
- Compétences
- Ressources
- Calendrier
- Mon Consultant

Le formateur aura les pages suivantes :

- Tableau de bord
- Gestion de bilans
- Ressources
- Calendrier
- Contacter l'OF

### Description des pages - côté bénéficiaire
#### Tableau de bord

Le tableau de bord contiendra les informations principales qu’un bénéficiaire souhaiterait voir.  
Exemples : progression en heures, _mes prochains créneaux_, etc.

#### Compétences

La page _Compétences_ affichera les compétences que le bénéficiaire doit acquérir, avec la possibilité d’ajouter une description pour chacune d’elles.

#### Ressources

Sur la page _Ressources_, le bénéficiaire pourra consulter les documents mis à sa disposition dans le cadre de son bilan.

#### Calendrier

Le _Calendrier_ affichera les créneaux planifiés du bilan et permettra également au bénéficiaire de rejoindre les réunions via **Dendreo Live**.

#### Mon Consultant

Cette page permettra au bénéficiaire de **contacter son consultant**, dont le numéro de téléphone et l’adresse e-mail professionnelle seront affichés.  
Il sera également possible de contacter le **CSM responsable**, avec affichage de ses informations de contact.

### Description des pages - côté consultant

#### Tableau de bord

Le tableau de bord du consultant devra afficher les prochains créneaux avec ses différents bénéficiaires

#### Gestion de bilans

Le consultant pourra voir sur cette page une liste de bilans selon le bénéficiaire. En cliquant sur celui de son choix, il devra pouvoir mettre à jour l'aquisition des compétences, programmer des créneaux, etc.

#### Calendrier

Même fonctionnalité que celui du bénéficiaire avec en plus, la possibilité de programmer des créneaux directement dessus.

#### Contacter l'OF

Permet au consultant de prendre RDV avec un membre du CSM.

## Fonctionnalités prévus pour la V2

### Générateur de CV

Le générateur de CV devra permettre de créer le CV du bénéficiaire à partir d’un formulaire à remplir.  
Des modèles (templates) devront être définis à l’avance afin que les données saisies puissent être intégrées automatiquement dans les champs correspondants du modèle choisi.

### Intégration avec Central Test

Le bénéficiaire pourra remplir un formulaire directement sur la WebApp.  
Les informations saisies seront ensuite transmises à l’API de **Central Test**.

# Roadmap

## Intégration données Dendreo -> WebApp

Définir la manière dont le bénéficiaire serait intégré à la plateforme BDC

Ex: créer son compte lorsqu'il est ajouté à l'ADF? créer son compte sur la plateforme -> création automatique sur Dendreo ?

Les infos pris sur Dendreo seront les suivant :

Bénéficiaire
- ID sur Dendreo
- Liste des ADFs dont lequel il est inscrit

Action de formation
- ID
- Catégorie de l'ADF
- Créneaux
	- Temps planifié
	- Temps passé

## Développement des fonctionnalités

Mettre en place les différentes pages selon la vue consultant/bénéficiaire

## Déploiement de l'application en publique

Définir les solutions d'hébergement et mettre déployer l'application

