# Examen blanc IELTS Academic

Un examen blanc complet, au format du **test sur ordinateur** (computer-delivered IELTS), pour mesurer précisément le niveau d’un·e candidat·e et produire un **bilan** qui servira à construire un entraînement sur mesure.

## Déroulé

| Épreuve | Durée | Contenu |
|---|---|---|
| Listening | ≈ 30 min + 2 min de vérification | 4 parties, 40 questions, enregistrement diffusé une seule fois |
| Reading | 60 min | 3 textes académiques, 40 questions, surlignage du texte |
| Writing | 60 min | Task 1 (graphique, 150 mots min.) et Task 2 (essai, 250 mots min.), sans correcteur orthographique |
| Speaking | 11–14 min | 3 parties avec une examinatrice enregistrée, réponses enregistrées et transcrites |

Tout le contenu (textes, scripts audio, questions) est **original** et suit fidèlement les formats officiels : formulaires, QCM, plan à légender, appariements, True/False/Not Given, Yes/No/Not Given, titres de paragraphes, résumés, fins de phrases.

## Le bilan

À la fin, l’application :

- corrige le Listening et le Reading (score sur 40, bande, détail par partie, par type de question et par compétence, nature des erreurs : orthographe, pluriel, limite de mots, piège, réponse vide) ;
- mesure le Writing (longueur, paragraphes, diversité lexicale, connecteurs, overview, position…) et le Speaking (durée des réponses, délai avant de parler, débit, pauses, transcription) ;
- recueille le ressenti et les préférences d’entraînement ;
- propose des priorités et un premier plan ;
- génère un **bilan Markdown** (avec un bloc JSON) à copier et à envoyer à Claude, qui corrige le Writing et le Speaking selon les critères officiels et construit l’application d’entraînement.

## Conseils pour un résultat fidèle

Un ordinateur, un casque avec micro, une pièce calme, Chrome ou Safari (pour la transcription du Speaking). Listening, Reading et Writing s’enchaînent sans pause, comme le jour J ; le Speaking peut se passer un autre jour.

## Confidentialité

Les réponses, les textes et les enregistrements restent dans le navigateur (localStorage et IndexedDB). Seule la transcription du Speaking passe par le service de reconnaissance vocale du navigateur.

## Structure

```
index.html            point d’entrée
assets/app.css        styles (cadre du test informatisé + bilan)
js/                   modules : épreuves, correction, analyse, export du bilan
data/                 questions, clés de correction et justifications
content/              scripts audio (Listening, examinatrice du Speaking)
audio/                enregistrements générés
tools/generate_audio.py  génération des audios (synthèse vocale Kokoro)
```

Pour régénérer les audios : `pip install kokoro-onnx soundfile`, télécharger `kokoro-v1.0.onnx` et `voices-v1.0.bin` (release *model-files-v1.0* de thewh1teagle/kokoro-onnx), puis `python3 tools/generate_audio.py --models <dossier>`.

Ajouter `?dev` à l’URL affiche des raccourcis de test (avance de l’audio, fin du chrono).
