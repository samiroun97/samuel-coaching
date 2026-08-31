-- ══════════════════════════════════════════════════════════════
-- Précise l'anatomie des 45 exercices "bras" : muscle_cible
-- reste "biceps"/"triceps" (filtre + silhouette react-body-highlighter).
-- La précision (biceps brachial, brachial, brachio-radial, triceps
-- brachial et ses 3 chefs long/latéral/médial...) va dans
-- muscle_travaille (texte affiché dans la fiche exercice) et
-- muscles_secondaires (tableau).
-- À coller et exécuter dans Supabase > SQL Editor
-- ══════════════════════════════════════════════════════════════

UPDATE public.exercices_catalogue AS e SET
  muscle_travaille = v.travaille,
  muscles_secondaires = v.secondaires
FROM (VALUES
  ('mk_bayesian-curl', 'Biceps brachial (chef long particulièrement étiré, bras derrière le buste), avec le brachial.', ARRAY['brachial']::text[]),
  ('mk_bench-dips', 'Triceps brachial, avec le deltoïde antérieur et le grand pectoral.', ARRAY['deltoïde antérieur','grand pectoral']::text[]),
  ('mk_cross-body-hammer-curl', 'Brachial et brachio-radial, avec le biceps brachial.', ARRAY['brachio-radial','biceps brachial']::text[]),
  ('mk_band-curl', 'Biceps brachial, avec le brachial et le brachio-radial.', ARRAY['brachial','brachio-radial']::text[]),
  ('mk_dumbbell-curl', 'Biceps brachial, avec le brachial et le brachio-radial.', ARRAY['brachial','brachio-radial']::text[]),
  ('mk_seated-dumbbell-curl', 'Biceps brachial, avec le brachial et le brachio-radial.', ARRAY['brachial','brachio-radial']::text[]),
  ('mk_barbell-curl', 'Biceps brachial, avec le brachial et le brachio-radial.', ARRAY['brachial','brachio-radial']::text[]),
  ('mk_cable-bar-curl', 'Biceps brachial, avec le brachial et le brachio-radial, tension continue.', ARRAY['brachial','brachio-radial']::text[]),
  ('mk_wide-grip-barbell-curl', 'Biceps brachial (chef court davantage sollicité, prise large), avec le brachial.', ARRAY['brachial']::text[]),
  ('mk_close-grip-barbell-curl', 'Biceps brachial (chef long davantage sollicité, prise serrée), avec le brachial.', ARRAY['brachial']::text[]),
  ('mk_spider-curl', 'Biceps brachial, isolation stricte (bras pendant, aucune aide de l''épaule), avec le brachial.', ARRAY['brachial']::text[]),
  ('mk_kettlebell-curl', 'Biceps brachial, avec le brachial et le brachio-radial.', ARRAY['brachial','brachio-radial']::text[]),
  ('mk_dumbbell-concentration-curl', 'Biceps brachial, isolation stricte (coude calé contre la cuisse), avec le brachial.', ARRAY['brachial']::text[]),
  ('mk_kettlebell-goblet-curl', 'Biceps brachial, avec le brachial et le brachio-radial.', ARRAY['brachial','brachio-radial']::text[]),
  ('mk_dumbbell-incline-curl', 'Biceps brachial (chef long en étirement, bras derrière le buste), avec le brachial.', ARRAY['brachial']::text[]),
  ('mk_dumbbell-hammer-curl', 'Brachial et brachio-radial, avec le biceps brachial (moins sollicité qu''en prise supination).', ARRAY['brachio-radial','biceps brachial']::text[]),
  ('mk_cable-rope-hammer-curl', 'Brachial et brachio-radial, avec le biceps brachial.', ARRAY['brachio-radial','biceps brachial']::text[]),
  ('mk_dumbbell-incline-hammer-curl', 'Brachial et brachio-radial, avec le biceps brachial, bras derrière le buste.', ARRAY['brachio-radial','biceps brachial']::text[]),
  ('mk_dumbbell-standing-single-arm-hammer-curl', 'Brachial et brachio-radial, avec le biceps brachial, un côté à la fois.', ARRAY['brachio-radial','biceps brachial']::text[]),
  ('mk_dumbbell-preacher-curl', 'Biceps brachial, isolation stricte (bras fixé sur le pupitre), avec le brachial.', ARRAY['brachial']::text[]),
  ('mk_ez-bar-preacher-curl', 'Biceps brachial, isolation stricte (bras fixé sur le pupitre), avec le brachial.', ARRAY['brachial']::text[]),
  ('mk_ez-bar-reverse-preacher-curl', 'Brachial et brachio-radial (prise pronation), biceps brachial moins sollicité.', ARRAY['biceps brachial']::text[]),
  ('mk_machine-preacher-curl', 'Biceps brachial, isolation stricte, avec le brachial.', ARRAY['brachial']::text[]),
  ('mk_barbell-drag-curl', 'Biceps brachial (chef long maintenu en tension sur toute l''amplitude), avec le brachial.', ARRAY['brachial']::text[]),
  ('mk_dumbbell-standing-single-arm-curl', 'Biceps brachial, avec le brachial et le brachio-radial, un côté à la fois.', ARRAY['brachial','brachio-radial']::text[]),
  ('mk_zottman-curl', 'Biceps brachial en montée (prise supination), brachio-radial en descente (prise pronation).', ARRAY['brachio-radial','brachial']::text[]),
  ('mk_barbell-close-grip-bench-press', 'Triceps brachial, avec le grand pectoral et le deltoïde antérieur.', ARRAY['grand pectoral','deltoïde antérieur']::text[]),
  ('mk_cable-bar-pushdown', 'Triceps brachial.', ARRAY[]::text[]),
  ('mk_cable-rope-pushdown', 'Triceps brachial (chef latéral davantage sollicité en fin de mouvement, rotation des poignets).', ARRAY[]::text[]),
  ('mk_machine-cable-v-bar-push-downs', 'Triceps brachial.', ARRAY[]::text[]),
  ('mk_machine-tricep-extension', 'Triceps brachial, trajectoire guidée.', ARRAY[]::text[]),
  ('mk_reverse-grip-tricep-pushdown', 'Triceps brachial (chef médial davantage sollicité, prise inversée).', ARRAY[]::text[]),
  ('mk_cable-rope-overhead-tricep-extension', 'Triceps brachial (chef long particulièrement étiré, bras au-dessus de la tête).', ARRAY[]::text[]),
  ('mk_dumbbell-seated-overhead-tricep-extension', 'Triceps brachial (chef long particulièrement étiré, bras au-dessus de la tête).', ARRAY[]::text[]),
  ('mk_single-arm-tricep-extension', 'Triceps brachial (chef long particulièrement étiré), un côté à la fois.', ARRAY[]::text[]),
  ('mk_cable-single-arm-rope-pushdown', 'Triceps brachial, un côté à la fois.', ARRAY[]::text[]),
  ('mk_single-arm-overhead-cable-extension', 'Triceps brachial (chef long particulièrement étiré, bras au-dessus de la tête), un côté à la fois.', ARRAY[]::text[]),
  ('mk_jm-press', 'Triceps brachial, avec le deltoïde antérieur et le grand pectoral.', ARRAY['deltoïde antérieur','grand pectoral']::text[]),
  ('mk_dumbbell-tricep-kickback', 'Triceps brachial, isolation stricte (coude fixé à l''horizontale).', ARRAY[]::text[]),
  ('mk_diamond-push-ups', 'Triceps brachial, avec le grand pectoral et le deltoïde antérieur.', ARRAY['grand pectoral','deltoïde antérieur']::text[]),
  ('mk_machine-underhand-row', 'Biceps brachial et grand dorsal, prise supination.', ARRAY['grand dorsal']::text[]),
  ('mk_dumbbell-skullcrusher', 'Triceps brachial (chef long particulièrement étiré, bras au-dessus de la tête).', ARRAY[]::text[]),
  ('mk_dumbbell-decline-skullcrusher', 'Triceps brachial (chef long particulièrement étiré, banc décliné).', ARRAY[]::text[]),
  ('mk_smith-machine-close-grip-bench-press', 'Triceps brachial, avec le grand pectoral et le deltoïde antérieur, trajectoire guidée.', ARRAY['grand pectoral','deltoïde antérieur']::text[]),
  ('mk_tate-press', 'Triceps brachial, coudes écartés.', ARRAY[]::text[])
) AS v(id, travaille, secondaires)
WHERE e.id = v.id;
