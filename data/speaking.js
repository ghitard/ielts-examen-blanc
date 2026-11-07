// Speaking — face-to-face format reproduced with a recorded examiner.
// `prompt` = audio file in audio/speaking/, `cap` = seconds before the examiner moves on.

export const CUE_CARD = {
  title: 'Describe a skill that took you a long time to learn.',
  points: [
    'what the skill was',
    'when and why you started learning it',
    'how you learned it'
  ],
  last: 'and explain how you felt when you were finally able to do it well.'
};

export const SPEAKING_STEPS = [
  { kind: 'ask', id: 'p1-name', part: 1, prompt: 'greet', text: 'Can you tell me your full name, please?', cap: 20, topic: 'Introduction' },
  { kind: 'ask', id: 'p1-call', part: 1, prompt: 'call', text: 'What shall I call you?', cap: 15, topic: 'Introduction' },
  { kind: 'ask', id: 'p1-from', part: 1, prompt: 'from', text: 'Can you tell me where you’re from?', cap: 30, topic: 'Introduction' },

  { kind: 'ask', id: 'p1-work-1', part: 1, prompt: 'p1_work_1', text: 'Do you work, or are you a student?', cap: 45, topic: 'Work or studies' },
  { kind: 'ask', id: 'p1-work-2', part: 1, prompt: 'p1_work_2', text: 'What do you enjoy most about it?', cap: 45, topic: 'Work or studies' },
  { kind: 'ask', id: 'p1-work-3', part: 1, prompt: 'p1_work_3', text: 'Is there anything you find difficult about it?', cap: 45, topic: 'Work or studies' },

  { kind: 'ask', id: 'p1-morn-1', part: 1, prompt: 'p1_morn_1', text: 'Are you a morning person?', cap: 45, topic: 'Mornings' },
  { kind: 'ask', id: 'p1-morn-2', part: 1, prompt: 'p1_morn_2', text: 'What do you usually do in the first hour after you wake up?', cap: 45, topic: 'Mornings' },
  { kind: 'ask', id: 'p1-morn-3', part: 1, prompt: 'p1_morn_3', text: 'Has your morning routine changed since you were a child?', cap: 45, topic: 'Mornings' },
  { kind: 'ask', id: 'p1-morn-4', part: 1, prompt: 'p1_morn_4', text: 'Is there anything you would like to change about your mornings?', cap: 45, topic: 'Mornings' },

  { kind: 'ask', id: 'p1-gift-1', part: 1, prompt: 'p1_gift_1', text: 'Do you enjoy choosing presents for other people?', cap: 45, topic: 'Gifts' },
  { kind: 'ask', id: 'p1-gift-2', part: 1, prompt: 'p1_gift_2', text: 'What was the last present you received?', cap: 45, topic: 'Gifts' },
  { kind: 'ask', id: 'p1-gift-3', part: 1, prompt: 'p1_gift_3', text: 'Do you think it’s better to give money or a present? Why?', cap: 45, topic: 'Gifts' },

  { kind: 'say', part: 2, prompt: 'p2_intro' },
  { kind: 'prep', part: 2, secs: 60 },
  { kind: 'ask', id: 'p2-long', part: 2, prompt: 'p2_start', text: 'Long turn: describe a skill that took you a long time to learn.', cap: 120, min: 60, more: 'p2_more', end: 'p2_stop', topic: 'Long turn' },
  { kind: 'ask', id: 'p2-round-1', part: 2, prompt: 'p2_round_1', text: 'Do you still use this skill today?', cap: 30, topic: 'Rounding-off' },
  { kind: 'ask', id: 'p2-round-2', part: 2, prompt: 'p2_round_2', text: 'Would you like to learn another skill like this one in the future?', cap: 30, topic: 'Rounding-off' },

  { kind: 'ask', id: 'p3-1', part: 3, prompt: 'p3_1', text: 'What practical skills do you think young people should learn at school?', cap: 90, topic: 'Learning practical skills' },
  { kind: 'ask', id: 'p3-2', part: 3, prompt: 'p3_2', text: 'Is it better to learn a skill from a teacher or from online videos? Why?', cap: 90, topic: 'Learning practical skills' },
  { kind: 'ask', id: 'p3-3', part: 3, prompt: 'p3_3', text: 'Why do you think some people give up when they are learning something new?', cap: 90, topic: 'Learning practical skills' },
  { kind: 'ask', id: 'p3-4', part: 3, prompt: 'p3_4', text: 'Which skills do you think will be most valuable for workers in the future?', cap: 90, topic: 'Skills and work' },
  { kind: 'ask', id: 'p3-5', part: 3, prompt: 'p3_5', text: 'Some people say that technology is making many traditional skills disappear. Do you think this is a problem?', cap: 90, topic: 'Skills and work' },
  { kind: 'ask', id: 'p3-6', part: 3, prompt: 'p3_6', text: 'Should employers pay for their staff to learn new skills, even when those skills are not directly related to their job?', cap: 90, topic: 'Skills and work' },

  { kind: 'say', part: 3, prompt: 'end', last: true }
];

export const SPEAKING_PROMPT_IDS = [
  'greet_morning', 'greet_afternoon', 'greet_evening', 'call', 'from',
  'p1_work_1', 'p1_work_2', 'p1_work_3', 'p1_morn_1', 'p1_morn_2', 'p1_morn_3', 'p1_morn_4',
  'p1_gift_1', 'p1_gift_2', 'p1_gift_3', 'p2_intro', 'p2_start', 'p2_more', 'p2_stop',
  'p2_round_1', 'p2_round_2', 'p3_1', 'p3_2', 'p3_3', 'p3_4', 'p3_5', 'p3_6', 'thanks', 'end'
];
