import csv
import random

random.seed(42)

case_names = [
    "Rajesh Kumar vs ABC Textiles", "Priya Sharma vs Delta Motors",
    "Sunita Devi vs Metro Housing", "Amit Singh vs Sunrise Traders",
    "Vikram Mehta vs Global Logistics", "Anjali Gupta vs Prime Builders",
    "Ravi Verma vs National Bank", "Kavita Rao vs Star Insurance"
]
people = ["Sudhanshu", "Sumit", "Aman", "Srishti", "the associate", "the junior counsel", "Mr. Mishra", "the paralegal"]
amounts = ["one lakh rupees", "two lakh rupees", "fifty thousand rupees", "five lakh rupees", "seventy-five thousand rupees"]
dates = ["15th of October", "3rd of November", "next Monday", "the 20th of this month", "next Friday", "the 5th of December"]
docs = ["legal notice", "draft agreement", "reply affidavit", "written statement", "settlement draft", "case summary"]

action_item_templates = [
    "{person} will prepare the {doc} by {date}.",
    "{person} needs to collect the remaining evidence from the client.",
    "We need to send the {doc} to the opposing counsel by {date}.",
    "{person} should follow up with the client regarding the missing documents.",
    "Please ensure the {doc} is filed before {date}.",
    "{person} will contact the client to confirm the settlement terms.",
    "We must submit the response to the court by {date}.",
    "{person} is responsible for verifying the property documents.",
]

decision_made_templates = [
    "The client has agreed to settle for {amount}.",
    "We have decided to proceed with the breach of contract claim.",
    "Both parties agreed to an out-of-court settlement.",
    "The firm decided to accept the case on a contingency basis.",
    "We concluded that this qualifies as a clear breach of contract.",
    "It was agreed that the defendant will pay {amount} within thirty days.",
    "The team decided to file for an injunction.",
    "We have decided not to pursue arbitration in this matter.",
]

general_discussion_templates = [
    "Today we discussed the {case} matter in detail.",
    "The client explained the background of the dispute.",
    "We reviewed the timeline of events leading to this case.",
    "The meeting covered the current status of the {case} case.",
    "We talked about the overall strategy for this case.",
    "The client shared their concerns about the delay in proceedings.",
    "We went over the key facts presented by the opposing party.",
    "There was a general discussion about the client's expectations.",
]

important_date_templates = [
    "The next hearing is scheduled for {date}.",
    "The payment was originally due on {date}.",
    "The court has set the next date of hearing as {date}.",
    "We have until {date} to file our response.",
    "The deadline for submitting evidence is {date}.",
    "The case was first filed on {date}.",
    "A follow-up meeting is scheduled for {date}.",
    "The limitation period expires on {date}.",
]

def fill(template):
    return template.format(
        person=random.choice(people),
        date=random.choice(dates),
        amount=random.choice(amounts),
        doc=random.choice(docs),
        case=random.choice(case_names),
    )

rows = []
for _ in range(60):
    rows.append((fill(random.choice(action_item_templates)), "action_item"))
    rows.append((fill(random.choice(decision_made_templates)), "decision_made"))
    rows.append((fill(random.choice(general_discussion_templates)), "general_discussion"))
    rows.append((fill(random.choice(important_date_templates)), "important_date"))

random.shuffle(rows)

with open("training_data.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["text", "label"])
    writer.writerows(rows)

print(f"Generated {len(rows)} labeled examples -> training_data.csv")