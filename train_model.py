# -*- coding: utf-8 -*-
"""
Trains a real Arabic/English sentiment classifier for Hajj & Umrah comments.
Pipeline: TF-IDF (word 1-2 grams) -> Multinomial Naive Bayes
Run this file once (or whenever dataset.py changes) to (re)build model.pkl.

    python train_model.py
"""
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

from dataset import TRAIN_DATA

MODEL_PATH = "model.pkl"

# Basic Arabic-aware stopword list (kept short & safe) plus common English stopwords.
STOPWORDS = {
    "في", "من", "على", "إلى", "عن", "مع", "هذا", "هذه", "ذلك", "التي", "الذي",
    "كان", "كانت", "و", "أو", "لا", "ما", "هو", "هي", "the", "a", "an", "is",
    "was", "were", "and", "or", "of", "to", "in", "on", "for", "with", "this",
    "that", "it", "we", "our", "us",
}


def build_pipeline():
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        max_features=4000,
        stop_words=list(STOPWORDS),
        sublinear_tf=True,
    )
    classifier = MultinomialNB(alpha=0.4)
    return Pipeline([("tfidf", vectorizer), ("nb", classifier)])


def train_and_save():
    texts = [t for t, _ in TRAIN_DATA]
    labels = [l for _, l in TRAIN_DATA]

    x_train, x_test, y_train, y_test = train_test_split(
        texts, labels, test_size=0.2, random_state=42, stratify=labels
    )

    pipeline = build_pipeline()
    pipeline.fit(x_train, y_train)

    preds = pipeline.predict(x_test)
    print("=== Hold-out evaluation ===")
    print("Accuracy:", round(accuracy_score(y_test, preds), 3))
    print(classification_report(y_test, preds, zero_division=0))

    # Re-fit on the FULL dataset before saving so the shipped model
    # uses every labeled example available.
    pipeline.fit(texts, labels)
    joblib.dump(pipeline, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH} (classes: {list(pipeline.classes_)})")
    return pipeline


if __name__ == "__main__":
    train_and_save()
