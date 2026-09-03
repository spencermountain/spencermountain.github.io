// row: 1 is the bottom track, higher rows stack upward
// color: a name from assets/colors.js (null falls back to grey)
const jobs = [
  {
    label: '',
    start: 'Nov 2004',
    end: 'June 2008',
    description: 'University',
    detail: '',
    labelPosition: 'inline',
    color: 'green',
    row: 1
  },
  {
    label: 'hmm',
    start: 'June 2008',
    end: 'Dec 2011',
    description: '',
    detail: '',
    height: '50%',
    labelPosition: 'above',
    color: 'yellow',
    nudgeX: 10,
    row: 1
  },
  {
    label: 'State.com',
    start: 'Nov 2010',
    end: 'Dec 2014',
    description: 'Social network',
    detail: 'Rails/Node REST api, design prototyping',
    labelPosition: 'inline',
    color: 'plum',
    row: 1
  },
  {
    label: 'Freelancing',
    start: 'Dec 2014',
    end: 'March 2024',
    description: 'Github',
    detail: 'taking on various client projects',
    labelPosition: 'inline',
    color: '#EBA256',
    row: 1
  },
  {
    label: 'KMStandards',
    start: 'Dec 2014',
    end: 'May 2015',
    description: 'Legal document NLP',
    detail: 'Identifying patterns and anomalies in legal documents',
    labelPosition: 'above',
    color: '#CA7165',
    nudgeX: -22,
    row: 2
  },
  {
    label: 'Govinvest',
    start: 'May 2015',
    end: 'Dec 2017',
    description: 'Pension liability analysis',
    detail: 'React + D3.js infographics dashboard',
    labelPosition: 'inline',
    color: 'blue',
    row: 2
  },
  {
    label: 'Small Wins',
    start: 'Dec 2015',
    end: 'Apr 2018',
    description: 'Task-management chatbot',
    detail: 'CI/CD for desktop app, timezone library',
    labelPosition: 'inline',
    color: 'pink',
    row: 3
  },
  {
    label: 'Venngage',
    start: 'Jan 2019',
    end: 'July 2019',
    description: 'Infographics studio',
    detail: 'Custom web infographics for corporate clients',
    labelPosition: 'above',
    nudgeX: -15,
    color: 'yellow',
    row: 3
  },
  {
    label: 'MBI',
    start: 'July 2019',
    end: 'May 2020',
    description: 'NHS medical text analysis',
    detail: 'TDD test-suite, for critical production QA',
    labelPosition: 'inline',
    color: 'plum',
    row: 2
  },
  {
    label: 'Moov',
    start: 'Jan 2020',
    end: 'May 2020',
    description: 'NLP engineering',
    detail: 'Document retrieval on web-text',
    labelPosition: 'above',
    color: '#D38B7C',
    row: 4
  },
  {
    label: 'Newton',
    start: 'Jan 2021',
    end: 'May 2021',
    description: 'NLP UI',
    detail: 'Cmd-K menu for email client',
    labelPosition: 'above',
    color: '#D9B3E5',
    row: 4
  },
  {
    label: 'Fluent',
    start: 'May 2020',
    end: 'Oct 2023',
    description: 'Language-learning application',
    detail: 'Client-side translation of internet text',
    labelPosition: 'inline',
    color: 'sky',
    row: 3
  },
  {
    label: 'City of Toronto',
    start: 'March 2024',
    end: 'Aug 2026',
    description: 'Transportation analytics',
    detail: 'Visualization of traffic volumes and collisions',
    labelPosition: 'inline',
    color: '#b18e7a',
    row: 1
  }
]
export default jobs
