// Listening — 4 parts, 40 questions. Original material written for this mock test.
// Answer keys: `a` = accepted answers (compared after normalisation), `digits` = compare digits only.
// `tags` feed the diagnostic: spelling, number, distractor, detail, paraphrase, orientation, opinion, academic.

const MAP_SVG = `
<svg class="map" viewBox="0 0 520 410" role="img" aria-label="Map of Ashford Park with eight lettered locations, A to H">
  <rect x="20" y="18" width="430" height="342" rx="6" class="map-park"/>
  <path d="M470 10 C 455 80, 488 140, 468 200 S 452 320, 474 400" class="map-river"/>
  <text x="493" y="210" class="map-label map-river-label" transform="rotate(90 493 210)">River Ash</text>
  <rect x="0" y="366" width="520" height="26" class="map-road"/>
  <text x="372" y="384" class="map-label">Station Road</text>
  <ellipse cx="240" cy="150" rx="112" ry="56" class="map-lake"/>
  <text x="240" y="156" class="map-label map-lake-label" text-anchor="middle">Lake</text>
  <ellipse cx="240" cy="150" rx="140" ry="82" class="map-path"/>
  <path d="M240 366 L240 232" class="map-path"/>
  <path d="M240 344 L80 344 L80 68 L160 68" class="map-path"/>
  <path d="M380 150 L410 150" class="map-path"/>
  <rect x="222" y="352" width="36" height="16" class="map-gate"/>
  <text x="240" y="401" class="map-label map-small" text-anchor="middle">Main entrance</text>
  <rect x="272" y="318" width="40" height="24" class="map-building"/>
  <rect x="168" y="318" width="40" height="24" class="map-building"/>
  <rect x="418" y="318" width="22" height="18" class="map-building"/>
  <rect x="226" y="52" width="30" height="18" class="map-building"/>
  <rect x="398" y="140" width="22" height="18" class="map-building"/>
  <g class="map-n"><path d="M500 52 L500 30 M494 37 L500 29 L506 37"/><text x="500" y="66" text-anchor="middle">N</text></g>
  <g class="map-pin"><circle cx="292" cy="330" r="12"/><text x="292" y="335">A</text></g>
  <g class="map-pin"><circle cx="188" cy="330" r="12"/><text x="188" y="335">B</text></g>
  <g class="map-pin"><circle cx="140" cy="282" r="12"/><text x="140" y="287">C</text></g>
  <g class="map-pin"><circle cx="292" cy="272" r="12"/><text x="292" y="277">D</text></g>
  <g class="map-pin"><circle cx="241" cy="38" r="12"/><text x="241" y="43">E</text></g>
  <g class="map-pin"><circle cx="409" cy="122" r="12"/><text x="409" y="127">F</text></g>
  <g class="map-pin"><circle cx="58" cy="40" r="12"/><text x="58" y="45">G</text></g>
  <g class="map-pin"><circle cx="429" cy="300" r="12"/><text x="429" y="305">H</text></g>
</svg>`;

export const LISTENING = {
  parts: [
    {
      id: 1,
      intro: 'Listen and answer questions 1–10.',
      groups: [
        {
          type: 'gap', range: [1, 10], limitWords: 1, allowNumber: true,
          instructions: 'Complete the notes below.<br>Write <b>ONE WORD AND/OR A NUMBER</b> for each answer.',
          html: `
<div class="notes">
  <h4>Greenway Cycle Tours — booking enquiry</h4>
  <p class="example"><i>Example</i><br>Tour chosen: the <span class="example-answer">Riverside</span> Tour</p>
  <h5>Customer details</h5>
  <ul>
    <li>Name: Sophie {{1}}</li>
    <li>Contact number: {{2}}</li>
  </ul>
  <h5>Tour details</h5>
  <ul>
    <li>Date: Sunday {{3}} May</li>
    <li>Number of cyclists: {{4}}</li>
    <li>Bikes: {{5}} bikes for everyone</li>
    <li>Meeting point: outside the {{6}} on Market Street</li>
  </ul>
  <h5>Costs</h5>
  <ul>
    <li>Group rate: £{{7}} per person</li>
    <li>Lunch: a picnic made by a local {{8}} (£6 extra per person)</li>
  </ul>
  <h5>Other information</h5>
  <ul>
    <li>Each cyclist should bring a waterproof {{9}}</li>
    <li>Customer heard about the company from a {{10}}</li>
  </ul>
</div>`
        }
      ]
    },
    {
      id: 2,
      intro: 'Listen and answer questions 11–20.',
      groups: [
        {
          type: 'mcq', range: [11, 14],
          instructions: 'Choose the correct letter, <b>A</b>, <b>B</b> or <b>C</b>.',
          items: [
            { q: 11, stem: 'Why was Ashford Park closed for almost two years?', options: { A: 'to build a new lake', B: 'to repair damage caused by flooding', C: 'to remove dangerous old trees' } },
            { q: 12, stem: 'What does the speaker say about the lake?', options: { A: 'A canoe club will run activities there.', B: 'Swimming will be allowed in certain areas.', C: 'Rowing boats can be hired from next spring.' } },
            { q: 13, stem: 'Volunteers are particularly needed to', options: { A: 'lead guided walks.', B: 'plant trees.', C: 'work in the café.' } },
            { q: 14, stem: 'The park will close earlier in winter because', options: { A: 'it is too expensive to stay open.', B: 'the paths do not have any lighting.', C: 'the wildlife needs to be protected.' } }
          ]
        },
        {
          type: 'match', ui: 'grid', range: [15, 20], letters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
          instructions: 'Label the map below.<br>Choose the correct letter, <b>A–H</b>, for questions 15–20.',
          title: 'Ashford Park',
          figure: MAP_SVG,
          items: [
            { q: 15, text: 'Visitor centre' },
            { q: 16, text: "Children's play area" },
            { q: 17, text: 'Wildflower meadow' },
            { q: 18, text: 'Picnic area' },
            { q: 19, text: 'Boathouse' },
            { q: 20, text: 'Bird hide' }
          ]
        }
      ]
    },
    {
      id: 3,
      intro: 'Listen and answer questions 21–30.',
      groups: [
        {
          type: 'mcq2', range: [21, 22],
          instructions: 'Choose <b>TWO</b> letters, <b>A–E</b>.',
          stem: 'Which <b>TWO</b> facts about Treadwell’s early history surprised the students?',
          options: {
            A: 'The founders had no experience in the shoe industry.',
            B: 'The company’s first product was unsuccessful.',
            C: 'Customers paid for the first factory.',
            D: 'The company began by repairing shoes.',
            E: 'The company has never paid for advertising.'
          }
        },
        {
          type: 'match', ui: 'grid', range: [23, 26], letters: ['A', 'B', 'C', 'D', 'E', 'F'],
          instructions: 'What do the students decide to do with each section of their case study?<br>Choose <b>FOUR</b> answers from the box and select the correct letter, <b>A–F</b>, for questions 23–26.',
          box: { title: 'Decisions', options: { A: 'shorten it', B: 'add more statistics', C: 'move part of it to an appendix', D: 'include a quotation', E: 'change the order of the points', F: 'leave it unchanged' } },
          title: 'Sections of the case study',
          items: [
            { q: 23, text: 'Introduction' },
            { q: 24, text: 'Company history' },
            { q: 25, text: 'Competitor analysis' },
            { q: 26, text: 'Recommendations' }
          ]
        },
        {
          type: 'mcq', range: [27, 30],
          instructions: 'Choose the correct letter, <b>A</b>, <b>B</b> or <b>C</b>.',
          items: [
            { q: 27, stem: 'Why did the students choose Treadwell for their case study?', options: { A: 'It has grown unusually quickly.', B: 'A lot of information about it is publicly available.', C: 'One of the students has a relative who works there.' } },
            { q: 28, stem: 'What does Ben consider to be the company’s main weakness?', options: { A: 'It has expanded abroad too fast.', B: 'Its products are too expensive.', C: 'Most of its income comes from a single product.' } },
            { q: 29, stem: 'Amira suggests that Treadwell should', options: { A: 'produce a range of shoes for children.', B: 'open more shops of its own.', C: 'work with a well-known designer.' } },
            { q: 30, stem: 'What do the students agree to do next?', options: { A: 'send a questionnaire to customers', B: 'ask their tutor for advice', C: 'share the remaining work between them' } }
          ]
        }
      ]
    },
    {
      id: 4,
      intro: 'Listen and answer questions 31–40.',
      groups: [
        {
          type: 'gap', range: [31, 40], limitWords: 1, allowNumber: false,
          instructions: 'Complete the notes below.<br>Write <b>ONE WORD ONLY</b> for each answer.',
          html: `
<div class="notes">
  <h4>Soundscape ecology</h4>
  <h5>Introduction</h5>
  <ul>
    <li>Studies the relationship between living organisms and their acoustic {{31}}</li>
    <li>Many early recordings of natural soundscapes were made by {{32}} rather than scientists</li>
  </ul>
  <h5>Sources of sound</h5>
  <ul>
    <li>Biophony: sounds produced by living organisms</li>
    <li>Geophony: natural sounds not made by living things, e.g. wind, or the cracking of {{33}} in polar regions</li>
    <li>Anthrophony: sounds produced by humans, most of which come from {{34}}</li>
  </ul>
  <h5>Methods</h5>
  <ul>
    <li>Recorders are left in place for several {{35}}</li>
    <li>Software produces an ‘acoustic index’, used as an indicator of the {{36}} of an ecosystem</li>
  </ul>
  <h5>Effects of noise on wildlife</h5>
  <ul>
    <li>Some birds in cities sing at a higher {{37}} than birds in the countryside</li>
    <li>Certain frogs call during {{38}} in traffic noise</li>
  </ul>
  <h5>Applications</h5>
  <ul>
    <li>Playing recordings of healthy reefs attracted more young {{39}} to damaged areas</li>
    <li>Could be used to check whether {{40}} projects are successful</li>
  </ul>
</div>`
        }
      ]
    }
  ],

  key: {
    1: { type: 'form', a: ['hargreaves'], show: 'Hargreaves', tags: ['spelling'], ev: "SOPHIE: Sure. It's H, A, R, G, R, E, A, V, E, S." },
    2: { type: 'form', digits: '07734558291', a: ['07734558291'], show: '07734 558 291', tags: ['number'], ev: "SOPHIE: It's oh seven seven three four, double five eight, two nine one." },
    3: { type: 'form', a: ['16', '16th', 'sixteenth', '16 th'], show: '16th', trap: ['9', '9th', 'ninth'], tags: ['number', 'distractor'], ev: "DANIEL: I'm afraid the ninth is fully booked. […] The following Sunday, the sixteenth, is still wide open." },
    4: { type: 'form', a: ['10', 'ten'], trap: ['12', 'twelve', '2', 'two'], tags: ['number', 'distractor'], ev: "SOPHIE: twelve people said yes, but two of my cousins have since told me they can't make it. So it'll be ten." },
    5: { type: 'form', a: ['electric'], trap: ['hybrid', 'mountain', 'standard'], tags: ['distractor'], ev: 'SOPHIE: Actually, could we just have electric bikes for everyone?' },
    6: { type: 'form', a: ['library'], trap: ['museum', 'post office', 'town museum'], tags: ['distractor'], ev: 'DANIEL: The meeting point used to be in front of the town museum […] We now meet outside the library on Market Street.' },
    7: { type: 'form', a: ['35', '35.00', 'thirty-five', 'thirty five'], show: '35', trap: ['42', '42.00', 'forty-two', '6'], tags: ['number', 'distractor'], ev: 'DANIEL: The standard price […] is forty-two pounds per person, but […] That brings it down to thirty-five pounds each.' },
    8: { type: 'form', a: ['bakery'], trap: ['pub'], tags: ['detail', 'distractor'], ev: "DANIEL: There's a pub halfway along the route […] They're made for us by a local bakery." },
    9: { type: 'form', a: ['jacket'], trap: ['helmet', 'helmets', 'sun cream', 'bag', 'lock', 'locks', 'map'], tags: ['detail', 'distractor'], ev: 'DANIEL: we provide helmets and locks […] everyone should bring a waterproof jacket.' },
    10: { type: 'form', a: ['podcast'], trap: ['website', 'colleague', 'friend'], tags: ['distractor'], ev: 'SOPHIE: I thought it was a colleague who mentioned you, but actually […] it was a podcast.' },

    11: { type: 'mcq', a: ['B'], tags: ['paraphrase', 'distractor'], ev: 'KAREN: the real problem was the storm […] Heavy rain flooded the whole lower half of the park, and the water destroyed most of the old drainage system.' },
    12: { type: 'mcq', a: ['C'], tags: ['paraphrase', 'distractor'], ev: "KAREN: that won't be ready until next spring. Once it is, we'll be hiring out rowing boats every weekend." },
    13: { type: 'mcq', a: ['A'], tags: ['paraphrase', 'distractor'], ev: 'KAREN: What we really need are people who can lead guided walks for schools and visitors.' },
    14: { type: 'mcq', a: ['B'], tags: ['paraphrase', 'distractor'], ev: "KAREN: Some people have suggested that this is to save money, but that isn't the case. It's simply that the new paths don't have any lighting yet." },
    15: { type: 'map', a: ['A'], tags: ['orientation'], ev: 'KAREN: As you come through the gates, the building immediately on your right is the visitor centre.' },
    16: { type: 'map', a: ['D'], tags: ['orientation'], ev: "KAREN: you'll pass the children's play area. It's on your right, about halfway between the entrance and the lake." },
    17: { type: 'map', a: ['C'], tags: ['orientation'], ev: "KAREN: take the path that turns left just after the entrance […] the large open area on the western side of the park. That's our new wildflower meadow." },
    18: { type: 'map', a: ['G'], tags: ['orientation'], ev: "KAREN: it'll bring you up to the north-west corner of the park, which is where we've put the picnic area." },
    19: { type: 'map', a: ['E'], tags: ['orientation'], ev: "KAREN: Halfway along the north shore, you'll see the boathouse." },
    20: { type: 'map', a: ['F'], tags: ['orientation'], ev: "KAREN: follow the path round to the eastern side of the lake, you'll find the hide right at the water's edge, between the lake and the river." },

    21: { type: 'mcq2', group: '21-22', a: ['C', 'D'], tags: ['opinion', 'distractor'], ev: 'AMIRA: I had no idea the company began by repairing old trainers […] BEN: the other thing that surprised me was how they paid for their first factory […] AMIRA: it was the customers who funded it.' },
    22: { type: 'mcq2', group: '21-22', a: ['C', 'D'], tags: ['opinion', 'distractor'], ev: "BEN: That's just a rumour […] The first model actually sold out […] They did spend money on social media adverts in their first year." },
    23: { type: 'matching', a: ['A'], tags: ['opinion', 'distractor'], ev: 'AMIRA: I think we could get it down to half a page without losing anything important.' },
    24: { type: 'matching', a: ['D'], tags: ['opinion', 'distractor'], ev: "BEN: I'd rather save the quotation for the company history." },
    25: { type: 'matching', a: ['C'], tags: ['opinion', 'distractor'], ev: 'BEN: Doctor Patel suggested putting the full table at the end, in an appendix […] AMIRA: I was going to suggest adding some figures […] but […] we’ve got more than enough numbers already.' },
    26: { type: 'matching', a: ['F'], tags: ['opinion', 'distractor'], ev: "AMIRA: I did think about changing the order […] BEN: I think the order is logical as it is. AMIRA: OK, let's not touch that section, then." },
    27: { type: 'mcq', a: ['B'], tags: ['opinion', 'distractor'], ev: 'AMIRA: Their growth is impressive, but lots of companies have grown quickly. For me, what really decided it was how much material is available.' },
    28: { type: 'mcq', a: ['C'], tags: ['opinion', 'distractor'], ev: 'BEN: almost eighty per cent of their sales come from just one model, the Trail Runner.' },
    29: { type: 'mcq', a: ['A'], tags: ['opinion', 'distractor'], ev: 'AMIRA: I think they should develop a range of children’s shoes.' },
    30: { type: 'mcq', a: ['C'], tags: ['opinion', 'distractor'], ev: "BEN: there isn't time before the deadline. […] she's away until Friday. AMIRA: Then I think we should just divide up what's left." },

    31: { type: 'form', a: ['environment'], tags: ['academic'], ev: 'LECTURER: It studies the relationship between living organisms and their acoustic environment.' },
    32: { type: 'form', a: ['musicians'], trap: ['scientists'], tags: ['academic', 'distractor'], ev: "LECTURER: many of the first people to make long recordings […] weren't scientists at all. They were musicians." },
    33: { type: 'form', a: ['ice'], tags: ['academic', 'detail'], ev: 'LECTURER: in polar regions, one of the most dramatic sounds is the cracking of ice.' },
    34: { type: 'form', a: ['traffic'], trap: ['machinery', 'aircraft', 'roads', 'cars'], tags: ['academic', 'distractor'], ev: 'LECTURER: Some of this comes from machinery or aircraft, but by far the largest source […] is traffic on the roads.' },
    35: { type: 'form', a: ['months'], trap: ['hours', 'weeks', 'days'], tags: ['academic', 'distractor'], ev: 'LECTURER: Rather than recording for an hour or two, researchers typically leave these devices in place for several months.' },
    36: { type: 'form', a: ['health'], tags: ['academic', 'paraphrase'], ev: "LECTURER: it's increasingly being used as an indicator of the overall health of an ecosystem." },
    37: { type: 'form', a: ['pitch'], tags: ['academic'], ev: 'LECTURER: some birds now sing at a higher pitch than birds of the same species living in the countryside.' },
    38: { type: 'form', a: ['gaps'], tags: ['academic', 'paraphrase'], ev: 'LECTURER: Certain frogs […] appear to wait for gaps in the traffic noise.' },
    39: { type: 'form', a: ['fish'], tags: ['academic'], ev: 'LECTURER: these areas attracted significantly more young fish than areas where no sound was played.' },
    40: { type: 'form', a: ['rewilding'], tags: ['academic', 'spelling'], ev: 'LECTURER: it could provide a cheap way of finding out whether rewilding projects […] are actually working.' }
  }
};
