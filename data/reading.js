// Academic Reading — 3 passages, 40 questions. Original texts written for this mock test.

export const READING = {
  parts: [
    {
      id: 1,
      intro: 'Read the text and answer questions 1–13.',
      advice: 'You should spend about 20 minutes on Questions 1–13, which are based on Reading Passage 1 below.',
      title: 'Bamboo: an ancient material with a modern future',
      passage: `
<p>For thousands of years, people across Asia, Africa and Latin America have built with bamboo. It has been used to make everything from houses and bridges to furniture, paper and musical instruments. In Hong Kong, scaffolding made from bamboo poles tied together with plastic strips is still a common sight on construction sites, even on skyscrapers more than fifty storeys high. Yet in Europe and North America, bamboo has traditionally been regarded as a decorative material at best – something for garden fences rather than serious construction. That attitude is now beginning to change.</p>
<p>Part of bamboo’s appeal lies in its extraordinary biology. Despite its woody appearance, bamboo is not a tree at all but a giant member of the grass family, and there are more than 1,400 known species. Some of these are among the fastest-growing plants on Earth: under ideal conditions, certain species can grow almost a metre in a single day. A new stem, known as a culm, reaches its full height within a few months and is ready to harvest after three to five years, compared with the several decades needed for most timber trees. Moreover, harvesting does not kill the plant. Because bamboo spreads through an extensive underground network of roots, new culms continue to emerge after mature ones are cut, so there is no need to replant.</p>
<p>Bamboo also has impressive mechanical properties. Its culms are hollow tubes divided at intervals by solid joints called nodes, a structure that makes them both light and remarkably resistant to bending. Measured by weight, the tensile strength of some species – their ability to resist being pulled apart – compares favourably with that of steel. Bamboo structures are also flexible, which allows them to absorb the energy of earthquakes rather than collapsing. Engineers who visited Costa Rica after a powerful earthquake in 1991 reported that a group of bamboo houses close to the epicentre had come through almost undamaged.</p>
<p>However, bamboo has significant weaknesses, and these explain much of the reluctance to use it in modern buildings. The first is durability. Bamboo contains large amounts of starch, which makes it highly attractive to insects such as beetles, and it is also vulnerable to fungal decay, particularly when it is in contact with damp ground. Untreated bamboo used outdoors may last only two or three years. A second problem is inconsistency. Because it is a natural material, no two culms are identical: diameter and wall thickness vary from one stem to the next and even along a single stem. This makes it difficult for engineers to calculate loads with confidence, and building regulations in most countries have been written with standardised materials such as steel, concrete and sawn timber in mind. Joining bamboo is also awkward, since round, hollow sections cannot simply be nailed together in the way that flat pieces of wood can.</p>
<p>Over the centuries, builders in bamboo-growing regions developed ways of dealing with these problems. Culms were usually cut in the dry season, when their starch content is lower. After cutting, they were often left standing in water for several weeks, allowing much of the remaining starch to be washed out, or held in the smoke of open fires, which made the surface less attractive to insects. Today, the most widely used method is to force a solution of boron salts into the culms under pressure. Boron protects bamboo against both insects and fungi, and it is considered relatively safe for people. Design matters as much as treatment, however. Experienced bamboo architects often say that a building needs ‘good boots and a good hat’: raising it on stone foundations keeps the bamboo away from moisture in the ground, while roofs with wide overhangs protect the walls from rain.</p>
<p>The most important recent development has been the emergence of engineered bamboo. In this process, culms are split into strips, which are then flattened and glued together under pressure to form boards and beams of standard sizes. One product, known as strand-woven bamboo, is made by compressing shredded fibres with resin, and the result is harder than many tropical hardwoods. Because engineered bamboo has predictable dimensions and properties, it can be used in the same way as conventional building materials, and it is already widely used for flooring and wall panels. The publication of international standards for bamboo structures has also given engineers and planning authorities greater confidence.</p>
<p>Supporters of bamboo argue that it could play a valuable role in reducing the environmental impact of the construction industry, since growing bamboo absorbs carbon dioxide rapidly. Researchers urge caution, though. Most of the world’s bamboo is grown in Asia, and shipping it to Europe or North America adds considerably to its environmental cost. The adhesives used in engineered products can also be difficult to recycle. Above all, if demand grows quickly, there is a risk that natural forests will be cleared to make way for bamboo plantations. Bamboo, in other words, is not a miracle material – but used wisely, it may prove to be one of the most useful materials of the twenty-first century.</p>`,
      groups: [
        {
          type: 'tfng', range: [1, 7],
          instructions: 'Do the following statements agree with the information given in Reading Passage 1?<br>Choose <b>TRUE</b> if the statement agrees with the information, <b>FALSE</b> if the statement contradicts the information, <b>NOT GIVEN</b> if there is no information on this.',
          items: [
            { q: 1, text: 'Bamboo scaffolding is no longer used on tall buildings in Hong Kong.' },
            { q: 2, text: 'Bamboo was first used as a building material in Asia.' },
            { q: 3, text: 'Botanically, bamboo belongs to the same family as grasses.' },
            { q: 4, text: 'Every species of bamboo is capable of growing almost a metre in a day.' },
            { q: 5, text: 'In the 1991 Costa Rica earthquake, bamboo houses suffered less damage than concrete buildings.' },
            { q: 6, text: 'The starch in bamboo makes it attractive to insects.' },
            { q: 7, text: 'Bamboo that is cut during the wet season contains relatively little starch.' }
          ]
        },
        {
          type: 'gap', range: [8, 13], limitWords: 1, allowNumber: false,
          instructions: 'Complete the notes below.<br>Choose <b>ONE WORD ONLY</b> from the passage for each answer.',
          html: `
<div class="notes">
  <h4>Making bamboo last longer</h4>
  <h5>Traditional treatments</h5>
  <ul>
    <li>cutting culms in the {{8}} season</li>
    <li>leaving culms in {{9}} for several weeks to remove starch</li>
    <li>holding culms in {{10}} from open fires</li>
  </ul>
  <h5>Modern treatment</h5>
  <ul>
    <li>forcing a solution of {{11}} salts into the culms</li>
  </ul>
  <h5>Building design</h5>
  <ul>
    <li>raising buildings on stone {{12}}</li>
    <li>building roofs with wide {{13}}</li>
  </ul>
</div>`
        }
      ]
    },
    {
      id: 2,
      intro: 'Read the text and answer questions 14–26.',
      advice: 'You should spend about 20 minutes on Questions 14–26, which are based on Reading Passage 2 below.',
      title: 'Finding our way',
      passage: `
<p><b class="para">A</b> Almost everyone has had the unsettling experience of being lost. For most of human history, finding one’s way across unfamiliar territory was a matter of survival, and our ancestors depended on a detailed knowledge of landmarks, the movements of the sun and stars, and the behaviour of animals. Today, many of us hand the task over to a smartphone, which calculates the quickest route and tells us when to turn. Few would wish to give up such a convenient tool. But a growing number of scientists are asking what happens to an ancient and complex mental skill when we stop using it.</p>
<p><b class="para">B</b> Psychologists distinguish between two broad strategies for getting from one place to another. The first, sometimes called route-based navigation, involves remembering a sequence of actions in relation to one’s own body: turn left at the bakery, go straight on past the school, then take the second right. This approach is quick and requires little effort on familiar journeys, but it is inflexible; if a road is closed, the route-follower may have no idea how to get round the obstacle. The second strategy depends on a mental representation of how places relate to one another – what the American psychologist Edward Tolman, after watching rats find short cuts through mazes in the 1940s, called a ‘cognitive map’. People who use this map-based approach can work out new routes and take detours with ease. Most of us use a combination of the two, but individuals differ considerably in which they rely on more.</p>
<p><b class="para">C</b> For decades, the idea of a map inside the head remained little more than a metaphor. That changed in the early 1970s, when the neuroscientist John O’Keefe, recording the activity of individual neurons in the hippocampus of rats, noticed that certain cells became active only when the animal was in one particular part of its enclosure. He called them ‘place cells’. Some thirty years later, May-Britt and Edvard Moser discovered another type of neuron in a neighbouring region of the brain. These ‘grid cells’ fire in a regular pattern as an animal moves, creating something like the lines on a map, which allows the brain to calculate distance and direction. In 2014, the three researchers shared the Nobel Prize in Physiology or Medicine for revealing what has been described as the brain’s own positioning system.</p>
<p><b class="para">D</b> Some of the most striking evidence about human navigation comes from London’s taxi drivers. To obtain a licence, drivers must pass a notoriously difficult examination known as ‘the Knowledge’, which requires them to memorise around 25,000 streets and thousands of landmarks; preparing for it typically takes three to four years. In 2000, a team led by the neuroscientist Eleanor Maguire reported that a region at the back of the hippocampus was larger in licensed taxi drivers than in people of similar age who did not drive taxis. To find out whether this difference was a cause or a consequence of the job, Maguire’s group later followed a group of trainees over several years. Those who qualified showed growth in this region; those who failed or gave up did not. The change, however, may come at a price: the qualified drivers performed less well than others on certain tests of visual memory.</p>
<p><b class="para">E</b> Culture and environment also shape our sense of direction. Traditional Polynesian navigators crossed thousands of kilometres of open ocean without instruments, reading the stars, the patterns of waves and the flight of seabirds. Language may play a part too. The linguist Stephen Levinson studied speakers of Guugu Yimithirr, an Aboriginal language of north-eastern Australia, which describes location not with words such as ‘left’ and ‘right’ but with compass directions – a speaker might say there is an insect on your ‘north leg’. Levinson found that speakers could point accurately towards distant places even in unfamiliar surroundings, suggesting that the language demands constant attention to orientation. More recently, a smartphone game called <i>Sea Hero Quest</i>, which asked players to steer a boat through virtual landscapes, collected navigation data from millions of people around the world. Its results indicated that people who grew up in rural areas tend to navigate better than those raised in cities, particularly cities with regular, grid-like street plans.</p>
<p><b class="para">F</b> If navigation can be strengthened by practice, can it also be weakened by neglect? A study by Véronique Bohbot and her colleagues at McGill University in Canada suggests that it might. They found that people who used satellite navigation more frequently had poorer spatial memory when they were asked to find their way without it. When a subset of participants was tested again three years later, those whose use of GPS had increased showed a steeper decline. Crucially, these individuals had not started out with a worse sense of direction, which suggests that heavy GPS use was not simply a consequence of poor navigation skills. The researchers acknowledge, however, that the follow-up group was very small, and larger studies are needed before firm conclusions can be drawn.</p>
<p><b class="para">G</b> None of this means that we should throw away our phones. Most researchers who study navigation use satellite technology themselves and see no reason to abandon it. Instead, they recommend using it more actively: looking at the whole route on a map before setting off, rather than simply following spoken instructions; paying attention to landmarks along the way; and occasionally switching the device off on familiar journeys. Like a muscle, it seems, our inner map stays strong only if we use it.</p>`,
      groups: [
        {
          type: 'match', ui: 'select', range: [14, 19], letters: ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'],
          instructions: 'Reading Passage 2 has seven paragraphs, <b>A–G</b>.<br>Choose the correct heading for paragraphs <b>B–G</b> from the list of headings below.',
          box: {
            title: 'List of Headings',
            options: {
              i: 'A game that turned into a research project',
              ii: 'Two contrasting ways of getting from place to place',
              iii: 'The brain’s built-in positioning system',
              iv: 'How intensive study can physically alter the brain',
              v: 'Why some people never get lost',
              vi: 'The influence of upbringing and language',
              vii: 'A possible drawback of digital assistance',
              viii: 'Making technology work for us rather than against us',
              ix: 'An ancient skill in the age of the smartphone',
              x: 'Animals that navigate using the stars'
            }
          },
          example: 'Example: Paragraph A — <b>ix</b>',
          items: [
            { q: 14, text: 'Paragraph B' },
            { q: 15, text: 'Paragraph C' },
            { q: 16, text: 'Paragraph D' },
            { q: 17, text: 'Paragraph E' },
            { q: 18, text: 'Paragraph F' },
            { q: 19, text: 'Paragraph G' }
          ]
        },
        {
          type: 'match', ui: 'select', range: [20, 23], letters: ['A', 'B', 'C', 'D', 'E'],
          instructions: 'Look at the following statements (questions 20–23) and the list of researchers below.<br>Match each statement with the correct researcher, <b>A–E</b>.',
          box: {
            title: 'List of Researchers',
            options: { A: 'Edward Tolman', B: 'John O’Keefe', C: 'Eleanor Maguire', D: 'Stephen Levinson', E: 'Véronique Bohbot' }
          },
          items: [
            { q: 20, text: 'An improvement in one mental ability may be accompanied by a weakness in another.' },
            { q: 21, text: 'Individual brain cells respond to an animal’s location.' },
            { q: 22, text: 'The structure of a language can encourage awareness of direction.' },
            { q: 23, text: 'Greater dependence on a navigation aid was associated with a worsening of a skill.' }
          ]
        },
        {
          type: 'gap', range: [24, 26], limitWords: 2, allowNumber: true,
          instructions: 'Complete the summary below.<br>Choose <b>NO MORE THAN TWO WORDS</b> from the passage for each answer.',
          html: `
<div class="notes summary">
  <h4>Satellite navigation and spatial skills</h4>
  <p>Researchers in Canada found that frequent users of satellite navigation had weaker {{24}} when they had to navigate unaided. When some of the participants were retested after {{25}}, those who had increased their use of GPS showed a greater decline. However, because the follow-up group was {{26}}, more research is needed.</p>
</div>`
        }
      ]
    },
    {
      id: 3,
      intro: 'Read the text and answer questions 27–40.',
      advice: 'You should spend about 20 minutes on Questions 27–40, which are based on Reading Passage 3 below.',
      title: 'The persistent myth of learning styles',
      passage: `
<p>Ask a room full of teachers whether students learn better when lessons are matched to their individual ‘learning style’ and most hands will go up. The idea that each of us is a visual, auditory or kinaesthetic learner – someone who learns best by seeing, hearing or doing – is one of the most widely held beliefs in education. In surveys carried out in several countries, more than nine out of ten teachers have agreed with it. It is not difficult to see why. The theory is intuitive, it is easy to explain to parents and students, and it carries an appealing message: that every learner is different and deserves to be taught in a way that suits them. It has also been commercially successful, supporting a whole industry of questionnaires, training courses and teaching materials. There is just one problem. After several decades of research, there is still almost no good evidence that it is true.</p>
<p>To understand why, it helps to be precise about what the theory claims. Its central prediction, sometimes called the ‘meshing hypothesis’, is that students will learn more when the way they are taught matches their preferred style. Testing this is not complicated in principle. Researchers must first identify each student’s style, then randomly assign students of each type to different kinds of teaching, and finally test them all in the same way. If the theory is correct, visual learners should do better with visual teaching and auditory learners with auditory teaching. In 2008, a team of psychologists led by Harold Pashler reviewed the research literature looking for studies of exactly this kind. They found remarkably few that had used an appropriate design, and those that did mostly failed to find the predicted pattern. Several directly contradicted it.</p>
<p>None of this means that people do not have preferences. Many of us would genuinely rather study a diagram than read a page of text, or listen to a podcast than watch a video. But a preference is not the same thing as a benefit, a distinction that is frequently lost in discussions of the subject. When researchers have measured both what students prefer and how much they actually learn, they have generally found that the first is a poor predictor of the second. What seems to matter far more is the nature of the material itself. Geography is best learned with maps, the pronunciation of a foreign language by listening, and swimming by getting into the water. In each case, the most effective method is determined by what is being taught, not by who is learning it.</p>
<p>Why, then, has the myth proved so durable? Part of the answer is that it offers something to everyone. It flatters students by suggesting that their difficulties are not their fault, it reassures parents that their children are unique, and it gives teachers a simple framework for planning lessons. Yet I suspect the most powerful reason is that it feels true. When we enjoy a particular kind of lesson, we tend to assume that we are learning more from it. Psychologists have shown repeatedly, however, that the sense of ease we experience while studying is an unreliable guide to how much we will remember later. In fact, conditions that make learning feel slower and more demanding often lead to better long-term results – a phenomenon the psychologist Robert Bjork has called ‘desirable difficulties’.</p>
<p>Some defenders of learning styles argue that, even if the theory is wrong, it does little harm: at worst, it encourages teachers to present material in a variety of ways. There is something in this. The push for variety has probably made many lessons more engaging, and there is good evidence that combining words with relevant images helps most learners, whatever their preferences. But the costs are real. Schools spend time and money on questionnaires and training that could be devoted to more effective approaches. More worryingly, students who are told that they are ‘visual learners’ may conclude that they are simply not suited to reading or listening, and may avoid tasks that would in fact help them develop. A label intended to empower can end up limiting what students believe they can achieve.</p>
<p>If not learning styles, then what? Cognitive scientists have identified a number of techniques that have been shown to work in laboratories and classrooms alike, across a wide range of subjects. One is retrieval practice: testing oneself on material, rather than simply rereading it. Another is spacing, which involves spreading study sessions out over days and weeks instead of cramming them into a single block; this tends to produce much longer-lasting learning. A third is interleaving – mixing different types of problem within a single study session. What these approaches have in common is that they require effort, and perhaps for this reason they are less popular than they deserve to be. In several studies, students rated such techniques as less effective than familiar methods like rereading, even when their own test results showed the opposite.</p>
<p>The lesson for teachers and learners alike is not that individual differences are unimportant. Students differ enormously in their prior knowledge, their interests and their motivation, and good teachers take all of these into account. But the question ‘How does this student prefer to learn?’ is far less useful than two others: ‘What does this material demand?’ and ‘What does the science of memory recommend?’ The most encouraging message we can give students is not that they have a single way of learning, but that all of them can learn effectively in many different ways.</p>`,
      groups: [
        {
          type: 'mcq', range: [27, 30],
          instructions: 'Choose the correct letter, <b>A</b>, <b>B</b>, <b>C</b> or <b>D</b>.',
          items: [
            { q: 27, stem: 'According to the first paragraph, one reason why the idea of learning styles is popular is that it', options: { A: 'has been officially endorsed by education ministries.', B: 'is simple to grasp and has an attractive message.', C: 'was developed by leading cognitive scientists.', D: 'has been confirmed by large-scale surveys of students.' } },
            { q: 28, stem: 'What did Pashler’s team find?', options: { A: 'Most studies showed that matching teaching to style had a small benefit.', B: 'Learning styles were impossible to measure accurately.', C: 'Few studies had been designed in a way that could test the theory.', D: 'Teachers had misunderstood the original theory.' } },
            { q: 29, stem: 'The writer refers to geography, languages and swimming in order to show that', options: { A: 'the best teaching method depends on the content.', B: 'practical subjects suit kinaesthetic learners.', C: 'students’ preferences differ between subjects.', D: 'some subjects are harder to teach than others.' } },
            { q: 30, stem: 'In the fourth paragraph, the writer suggests that the main reason why the belief persists is that it', options: { A: 'allows students to blame their teachers.', B: 'is promoted by companies that profit from it.', C: 'is taught on teacher-training courses.', D: 'matches people’s experience of enjoying certain lessons.' } }
          ]
        },
        {
          type: 'ynng', range: [31, 36],
          instructions: 'Do the following statements agree with the claims of the writer in Reading Passage 3?<br>Choose <b>YES</b> if the statement agrees with the claims of the writer, <b>NO</b> if the statement contradicts the claims of the writer, <b>NOT GIVEN</b> if it is impossible to say what the writer thinks about this.',
          items: [
            { q: 31, text: 'The difference between preferring a method and benefiting from it is often ignored.' },
            { q: 32, text: 'Students generally learn more when they are taught in the way they prefer.' },
            { q: 33, text: 'Teachers who believe in learning styles tend to have less classroom experience.' },
            { q: 34, text: 'If studying feels easy, this is a good indication that the material will be remembered.' },
            { q: 35, text: 'Describing students as a particular type of learner may discourage them from certain activities.' },
            { q: 36, text: 'Retrieval practice is more beneficial for younger students than for adults.' }
          ]
        },
        {
          type: 'match', ui: 'select', range: [37, 40], letters: ['A', 'B', 'C', 'D', 'E', 'F'],
          instructions: 'Complete each sentence with the correct ending, <b>A–F</b>, below.',
          box: {
            title: 'Endings',
            options: {
              A: 'take up time and money that would be better spent elsewhere.',
              B: 'is helpful to the majority of learners, regardless of their preferences.',
              C: 'is the only dependable method of identifying a learner’s style.',
              D: 'is likely to produce more durable learning.',
              E: 'are frequently judged by students to be less useful than they really are.',
              F: 'should be designed around each student’s personality.'
            }
          },
          items: [
            { q: 37, text: 'Combining words with relevant images' },
            { q: 38, text: 'Spreading study sessions over a longer period' },
            { q: 39, text: 'Study techniques that require effort' },
            { q: 40, text: 'Questionnaires designed to identify learning styles' }
          ]
        }
      ]
    }
  ],

  key: {
    1: { type: 'tfng', a: ['FALSE'], tags: ['detail'], ev: 'Scaffolding made from bamboo poles […] is still a common sight on construction sites, even on skyscrapers.' },
    2: { type: 'tfng', a: ['NOT GIVEN'], tags: ['detail'], ev: 'Le texte dit que l’Asie, l’Afrique et l’Amérique latine construisent avec le bambou depuis des millénaires, sans dire où il a été utilisé en premier.' },
    3: { type: 'tfng', a: ['TRUE'], tags: ['paraphrase'], ev: 'Bamboo is not a tree at all but a giant member of the grass family.' },
    4: { type: 'tfng', a: ['FALSE'], tags: ['detail'], ev: 'Under ideal conditions, certain species can grow almost a metre in a single day.' },
    5: { type: 'tfng', a: ['NOT GIVEN'], tags: ['detail'], ev: 'Le texte dit que les maisons en bambou ont été presque épargnées, mais ne les compare jamais aux bâtiments en béton.' },
    6: { type: 'tfng', a: ['TRUE'], tags: ['paraphrase'], ev: 'Bamboo contains large amounts of starch, which makes it highly attractive to insects such as beetles.' },
    7: { type: 'tfng', a: ['FALSE'], tags: ['paraphrase'], ev: 'Culms were usually cut in the dry season, when their starch content is lower.' },
    8: { type: 'notes', a: ['dry'], tags: ['scanning'], ev: 'Culms were usually cut in the dry season.' },
    9: { type: 'notes', a: ['water'], tags: ['scanning'], ev: 'They were often left standing in water for several weeks.' },
    10: { type: 'notes', a: ['smoke'], tags: ['scanning'], ev: 'or held in the smoke of open fires' },
    11: { type: 'notes', a: ['boron'], tags: ['scanning'], ev: 'to force a solution of boron salts into the culms under pressure' },
    12: { type: 'notes', a: ['foundations'], tags: ['scanning'], ev: 'raising it on stone foundations keeps the bamboo away from moisture' },
    13: { type: 'notes', a: ['overhangs'], tags: ['scanning'], ev: 'roofs with wide overhangs protect the walls from rain' },

    14: { type: 'headings', a: ['ii'], tags: ['gist'], ev: 'B : deux stratégies — route-based et map-based.' },
    15: { type: 'headings', a: ['iii'], tags: ['gist'], ev: 'C : place cells, grid cells, « the brain’s own positioning system ».' },
    16: { type: 'headings', a: ['iv'], tags: ['gist'], ev: 'D : « the Knowledge » et la croissance de l’hippocampe des chauffeurs qualifiés.' },
    17: { type: 'headings', a: ['vi'], tags: ['gist'], ev: 'E : culture, langue (Guugu Yimithirr) et lieu où l’on a grandi (Sea Hero Quest). Le jeu n’est qu’un exemple, pas l’idée principale.' },
    18: { type: 'headings', a: ['vii'], tags: ['gist'], ev: 'F : l’usage intensif du GPS associé à une moins bonne mémoire spatiale.' },
    19: { type: 'headings', a: ['viii'], tags: ['gist'], ev: 'G : garder le GPS mais l’utiliser plus activement.' },
    20: { type: 'features', a: ['C'], tags: ['scanning', 'paraphrase'], ev: 'Maguire : the qualified drivers performed less well than others on certain tests of visual memory.' },
    21: { type: 'features', a: ['B'], tags: ['scanning', 'paraphrase'], ev: 'O’Keefe : certain cells became active only when the animal was in one particular part of its enclosure.' },
    22: { type: 'features', a: ['D'], tags: ['scanning', 'paraphrase'], ev: 'Levinson : suggesting that the language demands constant attention to orientation.' },
    23: { type: 'features', a: ['E'], tags: ['scanning', 'paraphrase'], ev: 'Bohbot : those whose use of GPS had increased showed a steeper decline.' },
    24: { type: 'summary', a: ['spatial memory'], tags: ['paraphrase'], ev: 'people who used satellite navigation more frequently had poorer spatial memory' },
    25: { type: 'summary', a: ['three years', '3 years'], tags: ['paraphrase'], ev: 'When a subset of participants was tested again three years later' },
    26: { type: 'summary', a: ['very small', 'small'], tags: ['paraphrase'], ev: 'the follow-up group was very small' },

    27: { type: 'mcq', a: ['B'], tags: ['inference'], ev: 'The theory is intuitive, it is easy to explain […] and it carries an appealing message.' },
    28: { type: 'mcq', a: ['C'], tags: ['inference'], ev: 'They found remarkably few that had used an appropriate design.' },
    29: { type: 'mcq', a: ['A'], tags: ['inference'], ev: 'the most effective method is determined by what is being taught, not by who is learning it.' },
    30: { type: 'mcq', a: ['D'], tags: ['inference'], ev: 'I suspect the most powerful reason is that it feels true. When we enjoy a particular kind of lesson, we tend to assume that we are learning more.' },
    31: { type: 'ynng', a: ['YES'], tags: ['writer-view'], ev: 'a preference is not the same thing as a benefit, a distinction that is frequently lost in discussions of the subject.' },
    32: { type: 'ynng', a: ['NO'], tags: ['writer-view'], ev: 'they have generally found that the first is a poor predictor of the second.' },
    33: { type: 'ynng', a: ['NOT GIVEN'], tags: ['writer-view'], ev: 'Le texte cite le pourcentage d’enseignants qui y croient, jamais leur expérience.' },
    34: { type: 'ynng', a: ['NO'], tags: ['writer-view'], ev: 'the sense of ease we experience while studying is an unreliable guide to how much we will remember later.' },
    35: { type: 'ynng', a: ['YES'], tags: ['writer-view'], ev: 'students who are told that they are ‘visual learners’ […] may avoid tasks that would in fact help them develop.' },
    36: { type: 'ynng', a: ['NOT GIVEN'], tags: ['writer-view'], ev: 'Le texte dit que ces techniques marchent « across a wide range of subjects », sans comparer les âges.' },
    37: { type: 'endings', a: ['B'], tags: ['paraphrase', 'grammar'], ev: 'combining words with relevant images helps most learners, whatever their preferences.' },
    38: { type: 'endings', a: ['D'], tags: ['paraphrase', 'grammar'], ev: 'spacing […] tends to produce much longer-lasting learning.' },
    39: { type: 'endings', a: ['E'], tags: ['paraphrase', 'grammar'], ev: 'students rated such techniques as less effective than familiar methods […] even when their own test results showed the opposite.' },
    40: { type: 'endings', a: ['A'], tags: ['paraphrase', 'grammar'], ev: 'Schools spend time and money on questionnaires and training that could be devoted to more effective approaches.' }
  }
};
