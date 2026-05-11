import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import Image from "next/image";
import { cn, getSubjectIconSrc } from "@/lib/utils";




type CardListCompanion = Companion & { sessionRowId?: string; id?: string };

interface CardListProps {
  title: string;
  companions: CardListCompanion[];
  classNames?: string;
  /** Subtitle under the section title */
  description?: string;
}

const CardList = ({ title, companions, classNames, description }: CardListProps) => {
  return (
    <article className={cn("companion-list", classNames)}>
      <h2 className="font-bold text-3xl">{title}</h2>
      {description ? (
        <p className="mt-2 text-muted-foreground">{description}</p>
      ) : null}
      {companions.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-border bg-muted/20 p-6 text-muted-foreground">
          No completed sessions yet. Start a companion lesson and finish a call to see it here.
        </p>
      ) : (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-lg w-2/3">Lessons</TableHead>
            <TableHead className="text-lg">Subject</TableHead>
            <TableHead className="text-lg text-right">Duration</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companions.map(({ id, subject, name, topic, duration, sessionRowId }, index) => (
            <TableRow
              key={
                sessionRowId != null && sessionRowId !== ''
                  ? String(sessionRowId)
                  : `${id ?? 'row'}-${index}`
              }
            >
              <TableCell>
                <Link href={`/companions/${id}`}>
                  <div className="flex items-center gap-2">
                    <div className="relative flex size-[72px] shrink-0 items-center justify-center overflow-hidden rounded-lg max-md:hidden">
                      <Image
                        src={getSubjectIconSrc(String(subject))}
                        alt=""
                        width={35}
                        height={35}
                        unoptimized
                        className="size-[35px] object-contain"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <p className="font-bold text-2xl">{name}</p>
                      <p className="text-lg">{topic}</p>
                    </div>
                  </div>
                </Link>
              </TableCell>
              <TableCell>
                <div className="subject-badge w-fit max-md:hidden">
                  {subject}
                </div>
                <div className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg p-2 md:hidden">
                  <Image
                    src={getSubjectIconSrc(String(subject))}
                    alt=""
                    width={18}
                    height={18}
                    unoptimized
                    className="size-[18px] object-contain"
                  />
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 w-full justify-end">
                  <p className="text-2xl">
                    {duration} <span className="max-md:hidden">mins</span>
                  </p>
                  <Image
                    src="/icons/clock.svg"
                    alt=""
                    width={14}
                    height={14}
                    unoptimized
                    className="size-[14px] shrink-0 object-contain md:hidden"
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      )}
    </article>
  );
};

export default CardList;
