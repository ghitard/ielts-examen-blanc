// Academic Writing — Task 1 (report on a graph) and Task 2 (essay). Original prompts.

export const WRITING = {
  task1: {
    advice: 'You should spend about 20 minutes on this task.',
    prompt: 'The graph below shows the percentage of adults in one European country who regularly used four different methods to pay for goods in shops between 2006 and 2024.',
    instruction: 'Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    minWords: 150,
    chart: {
      title: 'Payment methods regularly used in shops',
      yLabel: '% of adults',
      years: [2006, 2009, 2012, 2015, 2018, 2021, 2024],
      max: 100,
      series: [
        { name: 'Cash', values: [78, 74, 67, 58, 46, 31, 24], dash: '' },
        { name: 'Debit card', values: [41, 46, 52, 58, 63, 66, 64], dash: '8 5' },
        { name: 'Credit card', values: [22, 21, 23, 24, 22, 19, 17], dash: '2 5' },
        { name: 'Mobile phone', values: [0, 0, 2, 6, 15, 37, 49], dash: '12 4 2 4' }
      ]
    },
    // What an examiner expects to see (used to brief Claude, never shown during the test).
    keyFeatures: [
      'Overview : forte baisse du cash (78 % → 24 %), essor du mobile (0 % → 49 %), carte de débit dominante à la fin ; carte de crédit stable et minoritaire.',
      'Croisements : débit = cash en 2015 (58 %) puis le dépasse ; le mobile dépasse le cash en 2021 (37 % vs 31 %).',
      'Débit : progression jusqu’à un pic de 66 % (2021) puis léger recul à 64 %.',
      'Mobile : quasi nul jusqu’en 2012, accélération spectaculaire après 2018.',
      'Crédit : entre 17 % et 24 %, léger déclin après 2015.'
    ]
  },
  task2: {
    advice: 'You should spend about 40 minutes on this task.',
    intro: 'Write about the following topic:',
    prompt: 'In some countries, governments are introducing taxes on products such as sugary drinks and fast food in order to encourage healthier lifestyles. Some people think this is an effective approach, while others believe it unfairly restricts personal choice.',
    question: 'Discuss both these views and give your own opinion.',
    instruction: 'Give reasons for your answer and include any relevant examples from your own knowledge or experience.',
    minWords: 250,
    taskType: 'Discuss both views + opinion'
  }
};
