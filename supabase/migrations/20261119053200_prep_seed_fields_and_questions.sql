-- Seeds public.prep_fields and a starter set of real interview-readiness
-- questions per field (public.prep_questions), so /growth/prep has
-- working content from day one rather than an empty state. Fields chosen
-- to match the same practical categories already used for Courses
-- (coding / business / design), not the open-ended free-text
-- field_of_interest from onboarding, which has no fixed taxonomy.
--
-- Questions are genuinely field-general interview-prep material — not
-- placeholder text — written to be useful on their own merits.

insert into public.prep_fields (slug, name, description, icon, sort_order) values
  ('web-dev', 'Web Development', 'Frontend, backend, and full-stack interview readiness.', 'Code2', 1),
  ('data-ai', 'Data & AI', 'Data analysis, machine learning, and AI engineering basics.', 'BrainCircuit', 2),
  ('product-design', 'Product & UI/UX Design', 'Design process, usability, and portfolio-review readiness.', 'PenTool', 3),
  ('business-entrepreneurship', 'Business & Entrepreneurship', 'Startup fundamentals, business model, and pitching readiness.', 'Briefcase', 4),
  ('general-workplace', 'General Workplace Readiness', 'Behavioral and soft-skill questions asked across almost any job interview.', 'Users', 5);

-- -----------------------------------------------------------------------
-- Web Development
-- -----------------------------------------------------------------------
with f as (select id from public.prep_fields where slug = 'web-dev')
insert into public.prep_questions (field_id, prompt, options, correct_option_index, explanation, difficulty)
select f.id, prompt, options::jsonb, correct_option_index, explanation, difficulty from f, (values
  ('What does "responsive design" primarily refer to?',
   '["A website that loads very quickly", "A layout that adapts to different screen sizes", "A site with lots of animations", "A server that responds quickly to requests"]',
   1, 'Responsive design is about layouts adapting fluidly to different screen sizes and devices using techniques like flexible grids, media queries, and relative units.', 'easy'),
  ('In HTTP, which status code indicates a successful request?',
   '["404", "500", "200", "301"]',
   2, '200 OK means the request succeeded. 404 is Not Found, 500 is a server error, and 301 is a permanent redirect.', 'easy'),
  ('What is the main difference between `let` and `const` in JavaScript?',
   '["`let` is faster than `const`", "`const` variables cannot be reassigned after declaration", "`let` only works inside functions", "There is no real difference"]',
   1, 'A `const` binding cannot be reassigned (though objects/arrays it points to can still be mutated). `let` allows reassignment.', 'easy'),
  ('What problem does CSS specificity solve?',
   '["Making pages load faster", "Deciding which conflicting CSS rule applies to an element", "Reducing file size", "Supporting older browsers"]',
   1, 'Specificity is the set of rules the browser uses to decide which CSS declaration wins when multiple selectors target the same element.', 'medium'),
  ('What is the purpose of an API in a web application?',
   '["To style the user interface", "To let different software components communicate with each other", "To store files on a server", "To compress images"]',
   1, 'An API (Application Programming Interface) defines how software components exchange data and requests with each other.', 'easy'),
  ('In a RESTful API, which HTTP method is conventionally used to update an existing resource?',
   '["GET", "POST", "PUT", "DELETE"]',
   2, 'PUT (or PATCH for partial updates) is conventionally used to update an existing resource. GET reads, POST creates, DELETE removes.', 'medium'),
  ('What does "state management" refer to in frontend development?',
   '["Managing which country a server is hosted in", "Tracking and updating data that affects what the UI displays", "Managing user login sessions only", "Compiling code for production"]',
   1, 'State management is about tracking data that changes over time (user input, fetched data, UI state) and keeping the interface in sync with it.', 'medium'),
  ('What is a common reason to use version control (like Git) on a project?',
   '["It makes the website load faster", "It tracks changes to code over time and enables collaboration", "It replaces the need for testing", "It automatically fixes bugs"]',
   1, 'Version control tracks every change to a codebase over time, letting multiple people collaborate safely and revert mistakes.', 'easy'),
  ('What is the main benefit of writing automated tests for your code?',
   '["Tests make the code run faster in production", "Tests catch regressions and confirm behavior before shipping changes", "Tests replace the need for documentation", "Tests are required by all browsers"]',
   1, 'Automated tests give confidence that changes haven''t broken existing behavior, catching regressions early.', 'medium'),
  ('What does it mean for a web app to be "accessible"?',
   '["It loads on slow internet connections", "It works well for people using assistive technologies like screen readers", "It is free to use", "It works on all browsers equally"]',
   1, 'Accessibility means the app can be used by people with disabilities, including those relying on screen readers, keyboard navigation, or other assistive tech.', 'medium')
) as q(prompt, options, correct_option_index, explanation, difficulty);

-- -----------------------------------------------------------------------
-- Data & AI
-- -----------------------------------------------------------------------
with f as (select id from public.prep_fields where slug = 'data-ai')
insert into public.prep_questions (field_id, prompt, options, correct_option_index, explanation, difficulty)
select f.id, prompt, options::jsonb, correct_option_index, explanation, difficulty from f, (values
  ('What is "overfitting" in machine learning?',
   '["A model that trains too slowly", "A model that performs well on training data but poorly on new data", "A model with too few parameters", "A model that only works on images"]',
   1, 'Overfitting happens when a model learns the training data too closely, including its noise, and fails to generalize to unseen data.', 'medium'),
  ('What is the purpose of splitting data into training and test sets?',
   '["To make the dataset smaller and faster to load", "To evaluate how well a model generalizes to data it hasn''t seen", "To remove duplicate records", "To anonymize personal data"]',
   1, 'A held-out test set lets you measure how the model performs on data it wasn''t trained on — a proxy for real-world performance.', 'easy'),
  ('In statistics, what does "correlation does not imply causation" mean?',
   '["Two variables can never be related", "Two variables moving together doesn''t prove one causes the other", "Correlated variables are always caused by a third factor", "Causation is impossible to prove"]',
   1, 'Two variables can be statistically correlated without one causing the other — there may be a confounding factor or pure coincidence.', 'easy'),
  ('What is a key difference between supervised and unsupervised learning?',
   '["Supervised learning uses labeled data; unsupervised learning finds patterns in unlabeled data", "Supervised learning is always more accurate", "Unsupervised learning requires more computing power", "There is no meaningful difference"]',
   0, 'Supervised learning trains on labeled examples with known outcomes; unsupervised learning looks for structure in data with no labels.', 'medium'),
  ('Why might a data scientist normalize or scale numeric features before training a model?',
   '["To make the data look nicer in charts", "Because many algorithms are sensitive to differences in feature scale", "To reduce the number of rows in a dataset", "It is only needed for text data"]',
   1, 'Many algorithms (like gradient descent-based models or distance-based methods) are sensitive to feature scale, so normalizing helps training converge properly and fairly weigh each feature.', 'medium'),
  ('What is a confusion matrix used for?',
   '["Visualizing how confusing a dataset is to read", "Summarizing a classification model''s correct and incorrect predictions by class", "Measuring how long training takes", "Comparing two different datasets" ]',
   1, 'A confusion matrix breaks down a classifier''s predictions versus actual labels, showing true/false positives and negatives per class.', 'medium'),
  ('What does "garbage in, garbage out" mean in a data context?',
   '["Old data should be deleted regularly", "Poor-quality input data leads to poor-quality results, regardless of the model used", "Models automatically clean bad data", "Large datasets are always garbage"]',
   1, 'The quality of a model''s output is fundamentally limited by the quality of the data it was trained or run on.', 'easy'),
  ('What is the main purpose of an AI model''s "prompt" in a large language model context?',
   '["It is the name of the model", "It is the input text that guides what the model generates", "It is a setting that controls model speed", "It stores the model''s training data"]',
   1, 'A prompt is the input given to the model — it provides the context and instructions that shape the generated output.', 'easy')
) as q(prompt, options, correct_option_index, explanation, difficulty);

-- -----------------------------------------------------------------------
-- Product & UI/UX Design
-- -----------------------------------------------------------------------
with f as (select id from public.prep_fields where slug = 'product-design')
insert into public.prep_questions (field_id, prompt, options, correct_option_index, explanation, difficulty)
select f.id, prompt, options::jsonb, correct_option_index, explanation, difficulty from f, (values
  ('What is the main purpose of a "wireframe" in the design process?',
   '["A final, pixel-perfect visual design", "A low-fidelity layout sketch focused on structure and flow, not visual detail", "A written document describing features", "A type of user testing"]',
   1, 'A wireframe is a low-fidelity blueprint of a screen''s layout and structure, used early to iterate quickly before investing in visual detail.', 'easy'),
  ('What does "usability testing" involve?',
   '["Testing the backend code for bugs", "Observing real users attempting tasks with a product to find friction points", "Checking a design against brand guidelines", "Measuring server load under traffic"]',
   1, 'Usability testing observes real (or representative) users completing tasks, revealing where they get confused or stuck.', 'easy'),
  ('What is the purpose of a "user persona" in design?',
   '["A legal document for data privacy", "A fictional but research-informed representation of a target user type", "A login profile on the app", "A marketing slogan"]',
   1, 'A persona is a composite, research-based representation of a user type, used to keep design decisions grounded in real user needs rather than guesswork.', 'easy'),
  ('Why is color contrast important in UI design?',
   '["It only matters for dark mode", "Sufficient contrast makes text and elements readable, including for users with low vision", "It affects how fast a page loads", "It is purely a stylistic preference with no functional impact"]',
   1, 'Good contrast ensures text and important UI elements are legible for all users, including those with visual impairments — this is also an accessibility requirement (e.g. WCAG).', 'medium'),
  ('What is the difference between UX and UI design?',
   '["They are the same thing with different names", "UX focuses on the overall experience and flow; UI focuses on the visual interface itself", "UI is only about colors; UX is only about code", "UX is for mobile apps; UI is for websites"]',
   1, 'UX (user experience) covers the overall journey, flow, and feel of using a product; UI (user interface) is the specific visual and interactive layer the user touches.', 'easy'),
  ('What is an "affordance" in design?',
   '["The price of a design tool", "A visual or interactive cue that suggests how an element can be used", "A type of font", "A legal term for intellectual property"]',
   1, 'An affordance is a design cue — like a button''s shadow suggesting it can be pressed — that signals to users how to interact with an element.', 'medium'),
  ('Why do designers create multiple iterations of a design rather than finalizing the first version?',
   '["To bill more hours", "Because early feedback and testing typically reveal issues that improve the design", "Because clients always reject the first version", "It is a formality with no real benefit"]',
   1, 'Iteration lets designers incorporate feedback and testing insights, catching usability problems before a design ships.', 'easy')
) as q(prompt, options, correct_option_index, explanation, difficulty);

-- -----------------------------------------------------------------------
-- Business & Entrepreneurship
-- -----------------------------------------------------------------------
with f as (select id from public.prep_fields where slug = 'business-entrepreneurship')
insert into public.prep_questions (field_id, prompt, options, correct_option_index, explanation, difficulty)
select f.id, prompt, options::jsonb, correct_option_index, explanation, difficulty from f, (values
  ('What is a "minimum viable product" (MVP)?',
   '["The cheapest version of a product to build", "A version of a product with just enough features to test a core assumption with real users", "The final, fully-featured version of a product", "A prototype that is never shown to anyone"]',
   1, 'An MVP has just enough functionality to test a key hypothesis with real users and gather feedback, before investing in a fully-built product.', 'easy'),
  ('What does "product-market fit" mean?',
   '["A product that works on all devices", "Evidence that a product satisfies a real, strong demand in its target market", "A product with a low price point", "A legal agreement between founders"]',
   1, 'Product-market fit means a product meets a genuine, strong demand — customers actively want and use it, often reflected in retention and organic growth.', 'medium'),
  ('In a basic business model, what does "revenue" refer to?',
   '["The total money left after all expenses are paid", "The total income generated from sales before expenses are subtracted", "The amount of money invested by founders", "Government subsidies given to a business"]',
   1, 'Revenue is the total income from sales or services, before subtracting costs — not the same as profit.', 'easy'),
  ('Why might a startup choose to "bootstrap" rather than raise investor funding?',
   '["Bootstrapping is required by law for new businesses", "To retain full ownership and control by funding growth from revenue or personal savings", "It guarantees faster growth than raising funding", "It eliminates all financial risk"]',
   1, 'Bootstrapping means funding the business from its own revenue or founders'' resources, which preserves ownership and control but can mean slower growth.', 'medium'),
  ('What is a "pitch deck" typically used for?',
   '["Internal employee training", "A concise presentation used to explain a business idea to investors or partners", "A legal contract for co-founders", "A product user manual"]',
   1, 'A pitch deck is a short slide presentation summarizing the problem, solution, market, business model, and team — used to persuade investors or partners.', 'easy'),
  ('What does "churn rate" measure in a subscription business?',
   '["How quickly a company hires new staff", "The percentage of customers who stop using a product over a given period", "The speed at which a product is manufactured", "The number of new customers acquired per month"]',
   1, 'Churn rate measures the proportion of customers who cancel or stop using a service over a given time period — a key retention metric.', 'medium'),
  ('Why is understanding your target customer important before building a product?',
   '["It is only important for marketing, not product decisions", "It helps ensure the product actually solves a real problem for real people", "It is a formality investors require but has no practical use", "Target customers never change their minds, so it is a one-time step"]',
   1, 'Knowing your target customer helps you build something that solves a genuine problem they have, rather than guessing at features no one wants.', 'easy')
) as q(prompt, options, correct_option_index, explanation, difficulty);

-- -----------------------------------------------------------------------
-- General Workplace Readiness
-- -----------------------------------------------------------------------
with f as (select id from public.prep_fields where slug = 'general-workplace')
insert into public.prep_questions (field_id, prompt, options, correct_option_index, explanation, difficulty)
select f.id, prompt, options::jsonb, correct_option_index, explanation, difficulty from f, (values
  ('When an interviewer asks "tell me about yourself," what is generally the best approach?',
   '["Recite your full resume line by line", "Give a brief, relevant summary connecting your background to the role you''re applying for", "Talk about your personal life and hobbies in detail", "Ask them to read your resume instead"]',
   1, 'A focused summary connecting relevant experience to the role shows you understand what matters for the position, rather than a generic recap.', 'easy'),
  ('What is the main purpose of asking the interviewer questions at the end of an interview?',
   '["It is just a formality with no real impact", "It shows genuine interest and helps you evaluate if the role is a good fit for you too", "It is only appropriate for senior roles", "It should be avoided to save time"]',
   1, 'Asking thoughtful questions shows engagement and helps you assess whether the role and company are actually right for you.', 'easy'),
  ('If you don''t know the answer to a technical or situational interview question, what is generally the better response?',
   '["Make up a plausible-sounding answer", "Say you don''t know and, if possible, explain how you''d go about finding out", "Change the subject", "Stay silent until they move to the next question"]',
   1, 'Honesty about a knowledge gap, paired with a reasonable plan for finding the answer, demonstrates integrity and problem-solving more than a confident guess would.', 'medium'),
  ('What does it typically mean to be given "constructive feedback" at work?',
   '["Criticism meant to discourage you", "Specific, actionable feedback intended to help you improve", "A formal warning before being let go", "Feedback that is always positive"]',
   1, 'Constructive feedback is meant to be specific and actionable, aimed at helping someone improve rather than simply criticizing them.', 'easy'),
  ('Why is it useful to research a company before an interview?',
   '["It is only useful for impressing the interviewer", "It helps you tailor your answers and ask informed questions about real fit", "Companies expect you to already know everything about them", "It has no real impact on interview outcomes"]',
   1, 'Understanding a company''s products, values, and challenges lets you give more relevant answers and ask questions that show genuine interest.', 'easy'),
  ('What is generally a healthy way to handle receiving criticism about your work?',
   '["Immediately defend every decision you made", "Listen, ask clarifying questions if needed, and consider what''s useful in it", "Ignore it if you disagree", "Take it personally and stop trying"]',
   1, 'Listening openly and evaluating feedback on its merits — rather than reacting defensively — tends to lead to real improvement and stronger working relationships.', 'medium')
) as q(prompt, options, correct_option_index, explanation, difficulty);
